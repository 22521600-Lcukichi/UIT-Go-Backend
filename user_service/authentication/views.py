from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
)


def get_tokens_for_user(user):
    """Generate JWT token for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'token_type': 'Bearer',
        'expires_in': 3600 #1hour
        
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/auth/register/ - Register a new user (passenger or driver)
    """
    
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, 
            'message': 'Đăng ký thành công'
        }, status=status.HTTP_201_CREATED)
        
    return Response({
        'success': False,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Đăng ký không thành công',
            'details': serializer.errors    
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """POST /api/auth/login/ - Login a user"""
    serializer = UserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'tokens': tokens
            },
            'message': 'Đăng nhập thành công'
        }, status=status.HTTP_200_OK)
    return Response({
        'success': False,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Đăng nhập không thành công',
            'details': serializer.errors    
        }
    }, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/auth/logout/ - Logout a user"""
    try: 
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'success': True,
                'message': 'Đăng xuất thành công'
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
                'success': False,
                'error': {
                    'code': 'AUTH_ERROR',
                    'message': str(e)   
                }
            }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """GET /api/users/me/
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'data': {
            'user': UserSerializer(request.user).data
        },
        'message': 'Lấy thông tin người dùng thành công'
    }, status=status.HTTP_200_OK)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_by_id(request, user_id):
    """
    GET /api/auth/{user_id}/
    Lấy thông tin người dùng bằng ID
    """
    
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data
            },
            'message': 'Lấy thông tin người dùng thành công'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist as e:
        return Response({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'User not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
            
    
    