from django.contrib import admin
from .models import DriverProfile


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    """Driver Profile Admin"""
    list_display = [
        'user', 
        'driver_license_number',  # ✅ Sửa từ license_number
        'vehicle_type', 
        'approval_status', 
        'is_online', 
        'created_at'
    ]
    
    list_filter = [
        'approval_status', 
        'vehicle_type', 
        'is_online', 
        'created_at'
    ]
    
    search_fields = [
        'user__email', 
        'user__full_name', 
        'driver_license_number',  # ✅ Sửa từ license_number
        'license_plate'  # ✅ Sửa từ vehicle_plate_number
    ]
    
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('User Info', {'fields': ('user',)}),
        
        ('Driver Details', {
            'fields': (
                'driver_license_number',  # ✅ Sửa
                'drive_license_expiry',  # ✅ Sửa từ license_expiry
                'vehicle_type', 
                'license_plate',  # ✅ Sửa từ vehicle_plate_number
                'vehicle_brand',  # ✅ Thêm
                'vehicle_model', 
                'vehicle_color'
            )
        }),
        
        ('Status', {
            'fields': (
                'approval_status', 
                'approval_note',  # ✅ Thêm
                'approved_at',  # ✅ Thêm
                'is_online',
                'last_online_at'  # ✅ Thêm thay vì current_lat/lng
            )
        }),
        
        ('Statistics', {
            'fields': (
                'total_trips',  # ✅ Thêm
                'total_earnings',  # ✅ Thêm
            )
        }),
        
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )