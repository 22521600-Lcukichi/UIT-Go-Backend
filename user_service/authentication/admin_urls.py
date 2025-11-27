from django.urls import path
from . import admin_views

# Admin API URLs
app_name = 'admin'

urlpatterns = [
    # Dashboard stats
    path('dashboard/stats/', admin_views.admin_dashboard_stats, name='dashboard-stats'),
    
    # User management
    path('users/', admin_views.admin_list_users, name='list-users'),
    path('users/<uuid:user_id>/', admin_views.admin_delete_user, name='delete-user'),
    
    # Driver management
    path('drivers/', admin_views.admin_list_drivers, name='list-drivers'),
    path('drivers/<uuid:driver_id>/approve/', admin_views.admin_approve_driver, name='approve-driver'),
]

