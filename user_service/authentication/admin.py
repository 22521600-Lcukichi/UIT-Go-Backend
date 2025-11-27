from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RefreshToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    list_display = ['email', 'full_name', 'phone', 'user_type', 'is_active', 'is_staff', 'is_verified', 'created_at']
    list_filter = ['user_type', 'is_active', 'is_staff', 'is_verified', 'created_at']
    search_fields = ['email', 'full_name', 'phone']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'phone', 'user_type')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'phone', 'user_type'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    """Refresh Token Admin"""
    list_display = ['user', 'token_hash', 'expires_at', 'is_revoked', 'created_at']
    list_filter = ['is_revoked', 'created_at', 'expires_at']
    search_fields = ['user__email', 'token_hash']
    readonly_fields = ['id', 'created_at', 'revoked_at']
    ordering = ['-created_at']