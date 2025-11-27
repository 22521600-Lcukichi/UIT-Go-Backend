from rest_framework import serializers
from .models import DriverProfile
from authentication.serializers import UserSerializer
import re
from datetime import date, datetime

class DriverProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a driver profile"""
    
    drive_license_expiry = serializers.DateField(
        required=True,
        error_messages={
            'required': 'Ngày hết hạn giấy phép lái xe là bắt buộc',
            'invalid': 'Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2024-02-23)'
        }
    )
    
    license_plate = serializers.CharField(
        required=True,
        max_length=20,
        error_messages={
            'required': 'Biển số xe là bắt buộc',
            'max_length': 'Biển số xe không được vượt quá 20 ký tự'
        }
    )
    
    driver_license_number = serializers.CharField(
        required=True,
        max_length=20,
        error_messages={
            'required': 'Số giấy phép lái xe là bắt buộc',
            'max_length': 'Số giấy phép lái xe không được vượt quá 20 ký tự'
        }
    )
    
    vehicle_type = serializers.ChoiceField(
        choices=DriverProfile.VEHICLE_TYPES_CHOICES,
        required=True,
        error_messages={
            'required': 'Loại xe là bắt buộc',
            'invalid_choice': 'Loại xe không hợp lệ. Phải là một trong: bike, car_4seats, car_7seats'
        }
    )
    
    class Meta:
        model = DriverProfile
        fields = [
           'vehicle_type',
           'vehicle_brand',
           'vehicle_model',
           'vehicle_color',
           'license_plate',
           'driver_license_number',
           'drive_license_expiry',  
           'vehicle_registration_number',
        ]
        # ✅ Đảm bảo các field quan trọng là required
        extra_kwargs = {
            'vehicle_brand': {'required': False, 'allow_blank': True},
            'vehicle_model': {'required': False, 'allow_blank': True},
            'vehicle_color': {'required': False, 'allow_blank': True},
            'vehicle_registration_number': {'required': False, 'allow_blank': True},
        }
    
    def validate_license_plate(self, value):
        """Validate biển số xe """
        if not value or not value.strip():
            raise serializers.ValidationError("Biển số xe không được để trống")
        
        plate_pattern = r'^\d{2}[A-Z]{1,2}-?\d{4,5}$'
        cleaned_value = value.replace(' ', '').upper()
        
        if not re.match(plate_pattern, cleaned_value):
            raise serializers.ValidationError(
                "Định dạng biển số xe không hợp lệ. "
                "Định dạng đúng: 2 số + 1-2 chữ cái + 4-5 số (ví dụ: 59A-12345)"
            )
        
        # ✅ Kiểm tra trùng lặp
        if DriverProfile.objects.filter(license_plate=cleaned_value).exists():
            raise serializers.ValidationError("Biển số xe này đã được đăng ký")
        
        return cleaned_value
    
    def validate_drive_license_expiry(self, value):
        """Validate ngày hết hạn giấy phép lái xe """
        if not value:
            raise serializers.ValidationError("Ngày hết hạn giấy phép lái xe là bắt buộc")
        
        # ✅ Kiểm tra định dạng date (phải là date object, không phải string)
        if not isinstance(value, date):
            try:
                # Thử parse nếu là string
                if isinstance(value, str):
                    value = datetime.strptime(value, '%Y-%m-%d').date()
                else:
                    raise serializers.ValidationError(
                        "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2024-02-23)"
                    )
            except ValueError:
                raise serializers.ValidationError(
                    "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2024-02-23)"
                )
        
        # ✅ Kiểm tra ngày không được trong quá khứ
        if value < date.today():
            raise serializers.ValidationError(
                f"Giấy phép lái xe đã hết hạn (hết hạn ngày {value.strftime('%d/%m/%Y')})"
            )
        
        return value
    
    def validate_vehicle_type(self, value):
        """Validate loại xe """
        if not value:
            raise serializers.ValidationError("Loại xe là bắt buộc")
        
        valid_types = ['bike', 'car_4seats', 'car_7seats']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Loại xe không hợp lệ. Phải là một trong: {', '.join(valid_types)}"
            )
        return value
    
    def validate(self, attrs):
        """✅ Validate toàn bộ data trước khi save - NGĂN CHẶN TỪ ĐẦU"""
        # Validate các field required
        required_fields = {
            'vehicle_type': 'Loại xe',
            'license_plate': 'Biển số xe',
            'driver_license_number': 'Số giấy phép lái xe',
            'drive_license_expiry': 'Ngày hết hạn giấy phép lái xe'
        }
        
        for field, field_name in required_fields.items():
            if field not in attrs or not attrs[field]:
                raise serializers.ValidationError({
                    field: f"{field_name} là bắt buộc"
                })
        
        # ✅ Đảm bảo không có dữ liệu nào được lưu nếu validation fail
        # (DRF sẽ tự động raise ValidationError nếu có lỗi)
        
        return attrs
    
    
class DriverStatsUpdateSerializer(serializers.Serializer):
    """Serializer để cập nhật thống kê của tài xế"""
    total_trips = serializers.IntegerField(required=False, min_value=0)
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0.00)

class DriverProfileSerializer(serializers.ModelSerializer):
    """Serializer để lấy thông tin tài xế"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DriverProfile
        fields = [
            'id', 'user', 'vehicle_type', 'vehicle_brand', 'vehicle_model',
            'vehicle_color', 'license_plate', 'driver_license_number',
            'drive_license_expiry', 'vehicle_registration_number', 
            'approval_status', 'approval_note', 'approved_at',
            'rating', 'total_trips', 'total_earnings',
            'is_online', 'last_online_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'approval_status', 'approved_at', 'rating',
            'total_trips', 'total_earnings', 'created_at', 'updated_at'
        ]
    
class DriverPublicSerializer(serializers.ModelSerializer):
    """Serializer for driver public details"""
    
    full_name = serializers.CharField(source='user.full_name')
    phone = serializers.CharField(source="user.phone")
    
    class Meta:
        model = DriverProfile
        fields = [
            'id', 'full_name', 'phone', 
            'vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_color',
            'license_plate', 'total_trips'
        ]
        
class DriverStatusUpdateSerializer(serializers.Serializer):
    """Serializer để cập nhật trạng thái online của tài xế"""
    is_online = serializers.BooleanField(required=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    def validate(self, attrs):
        """Validate vị trí khi online"""
        if attrs.get('is_online'):
            if not (attrs.get('latitude')) and not (attrs.get('longitude')):
                raise serializers.ValidationError("Vị trí không được để trống khi online")
        return attrs

