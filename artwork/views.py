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
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'login.html', {
                'error': 'Invalid username or password.',
                'username': username
            })

    return render(request, 'login.html')


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
