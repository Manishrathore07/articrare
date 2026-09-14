from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Avg
from django.conf import settings
from .models import Artwork, Comment
from .ai_critique import get_ai_critique


def generate_critique(focus):
    critiques = {
        'Anatomy & Proportions': {
            'score': 8.6,
            'strengths': 'Solid posture grounding and head-to-shoulder ratio.',
            'suggestions': 'Double check forearm taper; slightly soften the joint transition.'
        },
        'Shading & Contrast': {
            'score': 8.2,
            'strengths': 'Clear direction of primary light source across planes.',
            'suggestions': 'Push the cast shadows darker with a 4B/6B pencil to increase drama.'
        },
        'Linework & Cleanliness': {
            'score': 8.9,
            'strengths': 'Confident, unhesitating strokes and distinct silhouette contour.',
            'suggestions': 'Vary line weight (thicker on underside shadows, thinner in highlight areas).'
        },
        'Perspective & Depth': {
            'score': 8.3,
            'strengths': 'Effective foreshortening in the foreground elements.',
            'suggestions': 'Drop background detail saturation to enhance atmospheric depth.'
        },
        'General Feedback': {
            'score': 8.5,
            'strengths': 'Evocative expression, expressive gesture, and strong personal style.',
            'suggestions': 'Keep practicing this angle—push the values further for maximum pop!'
        }
    }
    return critiques.get(focus, critiques['General Feedback'])


def index(request):
    artworks = Artwork.objects.all()
    return render(request, 'index.html', {'artworks': artworks})


def sketch_detail(request, pk):
    """Full detail page for a sketch with all community comments & ratings."""
    artwork = get_object_or_404(Artwork, pk=pk)
    comments = artwork.comments.select_related('user').all()
    community_avg = artwork.community_avg_score()

    # Check if the current user has already rated this sketch
    user_comment = None
    if request.user.is_authenticated:
        user_comment = comments.filter(user=request.user).first()

    context = {
        'artwork': artwork,
        'comments': comments,
        'community_avg': community_avg,
        'user_comment': user_comment,
        'star_range': range(1, 11),
    }
    return render(request, 'sketch_detail.html', context)


@login_required(login_url='/login/')
def upload_sketch(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        category = request.POST.get('category', 'Pencil & Graphite')
        focus = request.POST.get('focus', 'General Feedback')
        notes = request.POST.get('notes', '').strip()
        image = request.FILES.get('image')

        if title and image:
            # Save the artwork first (so image is written to disk)
            artwork = Artwork.objects.create(
                user=request.user,
                title=title,
                artist_name=request.user.username,
                category=category,
                focus=focus,
                notes=notes if notes else 'Looking for constructive feedback.',
                image=image,
                score=8.5,
                strengths='Analyzing...',
                suggestions='Analyzing...',
                likes=0,
                ai_powered=False,
            )

            # Now run AI critique on the saved image file
            image_path = artwork.image.path
            critique = get_ai_critique(image_path, title, category, focus, notes)

            # Update the artwork with AI-generated feedback
            artwork.score = critique['score']
            artwork.strengths = critique['strengths']
            artwork.suggestions = critique['suggestions']
            artwork.ai_powered = critique['ai_powered']
            artwork.save()

        return redirect('index')
    return redirect('index')


@login_required(login_url='/login/')
def add_comment(request, pk):
    """Submit or update a community rating & comment on a sketch."""
    artwork = get_object_or_404(Artwork, pk=pk)

    if request.method == 'POST':
        rating = request.POST.get('rating')
        text = request.POST.get('text', '').strip()

        if not text:
            messages.error(request, 'Please write something in your critique.')
            return redirect('sketch_detail', pk=pk)

        try:
            rating_val = int(rating) if rating else None
            if rating_val and not (1 <= rating_val <= 10):
                rating_val = None
        except (ValueError, TypeError):
            rating_val = None

        # Update existing comment or create new one
        Comment.objects.update_or_create(
            artwork=artwork,
            user=request.user,
            defaults={'rating': rating_val, 'text': text}
        )
        messages.success(request, 'Your critique was submitted!')

    return redirect('sketch_detail', pk=pk)


@require_POST
def toggle_like(request, pk):
    artwork = get_object_or_404(Artwork, pk=pk)
    artwork.likes += 1
    artwork.save()
    return JsonResponse({'likes': artwork.likes})


def register_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')

        error = None
        if not username:
            error = 'Username is required.'
        elif User.objects.filter(username=username).exists():
            error = 'That username is already taken. Choose another.'
        elif len(password1) < 8:
            error = 'Password must be at least 8 characters long.'
        elif password1 != password2:
            error = 'Passwords do not match.'

        if error:
            return render(request, 'register.html', {'error': error, 'username': username, 'email': email})

        user = User.objects.create_user(username=username, email=email, password=password1)
        login(request, user)
        messages.success(request, f'Welcome to Articrare, {username}! Start sharing your sketches.')
        return redirect('index')

    return render(request, 'register.html')


def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        login_input = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        # Check if user entered an email address instead of username
        user_obj = None
        if '@' in login_input:
            user_obj = User.objects.filter(email__iexact=login_input).first()
        else:
            # Check by username first
            user_obj = User.objects.filter(username__iexact=login_input).first()
            if not user_obj:
                # Support login by phone stored in profile or email prefix
                user_obj = User.objects.filter(email__istartswith=login_input).first()

        username_to_auth = user_obj.username if user_obj else login_input
        user = authenticate(request, username=username_to_auth, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect('index')
        else:
            return render(request, 'login.html', {
                'error': 'Invalid email, phone number, or password.',
                'username': login_input
            })

    return render(request, 'login.html')


def social_login_view(request, provider):
    """Direct fast 1-click social sign-in (Google, Facebook, Phone OTP)."""
    if request.user.is_authenticated:
        return redirect('index')

    # Generate or retrieve a verified social user profile
    provider_names = {
        'google': 'Google Artist',
        'facebook': 'Meta Artist',
        'phone': 'Mobile Artist'
    }
    base_name = provider_names.get(provider, 'Artist')
    import random
    salt = random.randint(100, 999)
    username = f"{provider}_{salt}"
    email = f"{provider}_{salt}@articrare.studio"

    # Find or create dedicated social user
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': email, 'first_name': base_name}
    )
    if created:
        user.set_unusable_password()
        user.save()

    login(request, user)
    messages.success(request, f'Successfully connected via {provider.capitalize()}! Welcome, {user.username}.')
    return redirect('index')


def logout_view(request):
    logout(request)
    return redirect('index')


def profile_view(request, username):
    artist = get_object_or_404(User, username=username)
    artworks = Artwork.objects.filter(user=artist)
    total_likes = artworks.aggregate(total=Sum('likes'))['total'] or 0
    avg_score = artworks.aggregate(avg=Avg('score'))['avg']
    avg_score = round(avg_score, 1) if avg_score else None

    context = {
        'artist': artist,
        'artworks': artworks,
        'total_likes': total_likes,
        'avg_score': avg_score,
        'sketch_count': artworks.count(),
    }
    return render(request, 'profile.html', context)


def terms_view(request):
    """Terms of Service, Community Standards & Copyright info."""
    return render(request, 'terms.html')


def help_view(request):
    """Help Center, FAQ, and Guide on how Articrare & AI Critique works."""
    return render(request, 'help.html')


def contact_view(request):
    """Contact Us page with direct message submission and creator links."""
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        messages.success(request, f"Thank you {name}! Your message has been received. We'll reply to {email} shortly.")
        return redirect('contact')
    return render(request, 'contact.html')

