from django.db import models
from django.contrib.auth.models import User


class Artwork(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='artworks')
    title = models.CharField(max_length=200)
    artist_name = models.CharField(max_length=100, default='Manish')
    category = models.CharField(max_length=100)
    focus = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to='sketches/')
    score = models.DecimalField(max_digits=3, decimal_places=1, default=8.5)
    strengths = models.TextField(blank=True)
    suggestions = models.TextField(blank=True)
    likes = models.PositiveIntegerField(default=0)
    ai_powered = models.BooleanField(default=False)  # True when Gemini analyzed the image
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.artist_name} ({self.category})"

    def community_avg_score(self):
        """Returns the average community rating or None if no ratings yet."""
        ratings = self.comments.filter(rating__isnull=False)
        if ratings.exists():
            total = sum(c.rating for c in ratings)
            return round(total / ratings.count(), 1)
        return None

    def comment_count(self):
        return self.comments.count()


class Comment(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 11)]

    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        # One rating per user per artwork
        unique_together = ('artwork', 'user')

    def __str__(self):
        return f"{self.user.username} on '{self.artwork.title}' — {self.rating}/10"
