from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('upload/', views.upload_sketch, name='upload_sketch'),
    path('sketch/<int:pk>/', views.sketch_detail, name='sketch_detail'),
    path('sketch/<int:pk>/delete/', views.delete_artwork, name='delete_artwork'),
    path('sketch/<int:pk>/comment/', views.add_comment, name='add_comment'),
    path('like/<int:pk>/', views.toggle_like, name='toggle_like'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('login/<str:provider>/', views.social_login_view, name='social_login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('terms/', views.terms_view, name='terms'),
    path('help/', views.help_view, name='help'),
    path('contact/', views.contact_view, name='contact'),
]
