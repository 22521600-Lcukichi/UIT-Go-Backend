import uuid
from django.db import models
from authentication.models import User
# Create your models here
class DriverProfile(models.Model):
    """Driver profile with vehicle information and status"""
    VEHICLE_TYPES_CHOICES = [
        ('bike', 'Bike'),
        ('car_4seats', 'Car 4 Seats'),
        ('car_7seats', 'Car 7 Seats'),
    ]
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    
    #Vehicle Information
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES_CHOICES, null=True, blank=True)
    vehicle_brand = models.CharField(max_length=100, blank=True)
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_color = models.CharField(max_length=50, blank=True)
    license_plate = models.CharField(max_length=20, blank=True)
    
    #Documents
    driver_license_number = models.CharField(max_length=20, blank=True)
    drive_license_expiry = models.DateField(null=True, blank=True)
    vehicle_registration_number = models.CharField(max_length=20, blank=True)
    
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending',
    )
    
    approval_note = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.UUIDField(null=True, blank=True)
    
    total_trips = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    is_online = models.BooleanField(default=False)
    last_online_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'driver_profiles'
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["approval_status"]),
            models.Index(fields=["license_plate"]),
        ]
    def __str__(self):
        return f"Driver: {self.user.full_name} ({self.license_plate})"  
    
    
    