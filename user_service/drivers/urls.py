from django.urls import path
from . import views

app_name = 'drivers'

urlpatterns = [
    #Driver endpoints
    #driver profile endpoints
    path('me/profile/', views.get_my_driver_profile, name='get-my-driver-profile'),
    path('<uuid:driver_id>/profile/', views.get_driver_profile_by_id, name='driver-profile'),
    #driver registration endpoints
    path('register/', views.register_driver_profile, name='register-driver-profile'),
    #driver status endpoints
    path('me/status/', views.update_driver_status, name='update-driver-status'),
    path('<uuid:driver_id>/stats/', views.update_driver_stats, name='update-driver-stats'),
]
