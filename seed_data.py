import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from artwork.models import Artwork
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw
import io

# Only seed if no artwork exists
if Artwork.objects.count() == 0:
    # Create an artistic placeholder sketch with PIL
    img = Image.new('RGB', (800, 600), color='#141923')
    draw = ImageDraw.Draw(img)

    # Draw stylish sketch lines
    for offset in range(-100, 300, 20):
        draw.line([(100 + offset, 100), (500 + offset, 500)], fill='#475569', width=2)
    draw.arc([250, 150, 550, 450], start=0, end=360, fill='#818cf8', width=3)
    draw.rectangle([200, 200, 600, 400], outline='#a855f7', width=2)

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=90)
    buf.seek(0)

    sample = Artwork(
        title='Zoro — Three Sword Stance Study',
        artist_name='Manish',
        category='Anime & Manga',
        focus='Linework & Cleanliness',
        notes='Practicing blade perspective and dynamic folds on the gi. Looking for feedback on weight balance.',
        score=8.8,
        strengths='Dynamic silhouette gesture, bold focal lines along the central blade.',
        suggestions='Add deeper cross-hatching in the fold shadows to enhance depth.',
        likes=12
    )
    sample.image.save('zoro_study_sample.jpg', ContentFile(buf.getvalue()), save=True)
    print("Successfully seeded initial artwork into SQLite database!")
else:
    print(f"Database already contains {Artwork.objects.count()} artworks.")
