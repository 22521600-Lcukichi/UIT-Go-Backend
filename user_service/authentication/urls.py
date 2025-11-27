from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'
    
urlpatterns = [
    #Authentication endpoints
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.current_user_view, name='current-user'),
    path('<uuid:user_id>/', views.get_user_by_id, name='get-user'),
    path('refresh-token/', TokenRefreshView.as_view(), name='refresh-token'),
]

