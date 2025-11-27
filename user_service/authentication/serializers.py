from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
import re

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'password', 'password_confirm', 'user_type']
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            'user_type': {'required': True},     
        }
        
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value.lower()
    
    def validate_phone(self, value):
        """Validate phone format (Vietnam)"""
        if value:
            phone_pattern = r'^0\d{9,10}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError(
                    "Phone must start with 0 and have 10-11 digits"
                )
        return value
    def validate_user_type(self, value):
        if value not in ['passenger', 'driver']:
            raise serializers.ValidationError("Invalid user type")
        return value
    
    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Passwords do not match"
            })
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user
    
class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        """Validate credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
     
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
            
        user = authenticate(email=email, password=password)
            
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        if not user.is_active:
            raise serializers.ValidationError("Account is not active")
            
        attrs['user'] = user
        return attrs
        
    
    
class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'user_type', 
            'is_active', 'is_verified', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'user_type', 'created_at', 'updated_at', 'last_login']
        
class TokenSerializer(serializers.Serializer):
    """Serializer for token response"""
    
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_type = serializers.CharField(default='Bearer')
    expires_in = serializers.IntegerField()


class AuthResponseSerializer(serializers.Serializer):
    """Serializer for authentication response"""
    
    user = UserSerializer()
    tokens = TokenSerializer()