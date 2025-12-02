from django.shortcuts import render
from django.conf import settings
import requests

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import DriverProfile
from .serializers import (
    DriverProfileCreateSerializer,
    DriverProfileSerializer,
    DriverStatusUpdateSerializer,
    DriverStatsUpdateSerializer
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_driver_profile(request):
    """POST /api/drivers/register/ 
    Đăng kí thông tin tài xế (API nội bộ được bảo mật bằng API Gateway)
    """
    user = request.user
    
    if user.user_type != 'driver':
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ tài xế mới được đăng kí thông tin tài xế'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if hasattr(user, 'driver_profile'):
        return Response({
            'success': False,
            'error': {
                'code': 'CONFLICT',
                'message': 'Thông tin tài xế đã tồn tại'
            }
        }, status=status.HTTP_409_CONFLICT)
        
    serializer = DriverProfileCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        # ❌ Validation FAIL → KHÔNG save, trả về lỗi chi tiết
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Đăng kí thông tin tài xế không thành công. Vui lòng kiểm tra lại thông tin.',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # ✅ CHỈ KHI validation PASS → mới save
    try:
        driver_profile = serializer.save(user=user)
        return Response({
            'success': True,
            'data': {
                'driver_profile': DriverProfileSerializer(driver_profile).data
            },
            'message': 'Đăng kí thông tin tài xế thành công'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        # ❌ Nếu có lỗi khi save → rollback và báo lỗi
        return Response({
            'success': False,
            'error': {
                'code': 'SAVE_ERROR',
                'message': f'Lỗi khi lưu thông tin: {str(e)}'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_driver_profile(request):
    """GET /api/drivers/me/profile
    """
    if not hasattr(request.user, 'driver_profile'):
        return Response({
            'success': False,
            'error': {
                'code': 'NOT FOUND',
                'message': 'Thông tin tài xế không tồn tại'
            }
        }, status=status.HTTP_404_NOT_FOUND)
        
    driver_profile = request.user.driver_profile
    serializer = DriverProfileSerializer(driver_profile)
    return Response({
        'success': True,
        'data': {
            'driver_profile': serializer.data
        },
        'message': 'Lấy thông tin tài xế thành công'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_driver_profile_by_id(request, driver_id):
    """
    GET /api/drivers/{driver_id}/profile
    Lấy thông tin tài xế bằng ID
    """
    try:
        driver_profile = DriverProfile.objects.select_related('user').get(user_id=driver_id)
        serializer = DriverProfileSerializer(driver_profile)
        return Response({
            'success': True,
            'data': {
                'driver_profile': serializer.data
            },
            'message': 'Lấy thông tin tài xế (theo id) thành công'
        }, status=status.HTTP_200_OK)
    except DriverProfile.DoesNotExist:
        return Response({
            'success': False,
            'error': {
                'code': 'NOT FOUND',
                'message': 'Thông tin tài xế không tồn tại'
            }
        }, status=status.HTTP_404_NOT_FOUND)
        
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_driver_status(request):
    """
    PUT /api/drivers/me/status/
    Cập nhật trạng thái online của tài xế
    """
    user = request.user
    
    #Kiểm tra xem tài xế có phải là tài xế không
    if user.user_type != 'driver':
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ tài xế mới được cập nhật trạng thái online'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    #Kiểm tra xem tài xế có tồn tại không
    if not hasattr(user, 'driver_profile'):
        return Response({
            'success': False,
            'error': {
                'code': 'NOT FOUND',
                'message': 'Thông tin tài xế không tồn tại'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    driver_profile = user.driver_profile
    
    if driver_profile.approval_status != 'approved':
        return Response({
            'success': False,
            'error': {
                    'code': 'FORBIDDEN',
                    'message': 'Tài xế chưa được phê duyệt, vui lòng đợi phê duyệt'
            }
        }, status=status.HTTP_403_FORBIDDEN)
        
    
    serializer = DriverStatusUpdateSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Dữ liệu không hợp lệ',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        driver_profile = user.driver_profile
        is_online = serializer.validated_data['is_online']
        latitude = serializer.validated_data.get('latitude')
        longitude = serializer.validated_data.get('longitude')
        
        driver_profile.is_online = is_online
        if is_online:
            driver_profile.last_online_at = timezone.now()
        driver_profile.save()
        
        #Thông báo đến DriverService
        try:
            driver_service_url = getattr(settings, 'DRIVER_SERVICE_URL', None)
            internal_service_token = getattr(settings, 'INTERNAL_SERVICE_TOKEN', None)
            #Nếu DriverService có URL và tài xế đang online, gửi thông báo đến DriverService
            if driver_service_url and is_online:
                response = requests.put(
                    f'{driver_service_url}/api/drivers/{user.id}/status/',
                    json={
                        'is_online': is_online,
                        'vehicle_type': driver_profile.vehicle_type,
                        'latitude': float(latitude) if latitude else None,
                        'longitude': float(longitude) if longitude else None
                    },
                    headers={'X-Internal-Service-Token': internal_service_token} if internal_service_token else {},
                    timeout=5
                )
                response.raise_for_status() #Nếu có lỗi, sẽ ném ra lỗi
            #Nếu DriverService có URL và tài xế đang offline, gửi thông báo đến DriverService
            elif driver_service_url and not is_online:
                #Going offline
                response = requests.put(
                    f'{driver_service_url}/api/drivers/{user.id}/status/',
                    json={
                        'is_online': False
                    },
                    headers={'X-Internal-Service-Token': internal_service_token} if internal_service_token else {},
                    timeout=5
                )
                response.raise_for_status() #Nếu có lỗi, sẽ ném ra lỗi
        except Exception as e:
            print(f"Lỗi khi gửi thông báo đến DriverService: {e}")
        
        return Response({
            'success': True,
            'data': {
                'driver_id': str(user.id),
                'is_online': is_online,
                'vehicle_type': driver_profile.vehicle_type,
                'updated_at': timezone.now().isoformat()
            },
            'message': f"Cập nhật trạng thái online của tài xế {user.id} thành công"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': {
                'code': 'SAVE_ERROR',
                'message': f'Lỗi khi lưu thông tin: {str(e)}'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_driver_stats(request, driver_id):
    """PATCH /api/drivers/{driver_id}/stats/
    Cập nhật thống kê của tài xế
    """
    
    #Xác thực internal service token
    service_token = request.headers.get('X-Internal-Service-Token') or request.headers.get('X-Service-Token')
    if service_token != getattr(settings, 'INTERNAL_SERVICE_TOKEN', None):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Internal service token không hợp lệ'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    try:
        driver_profile = DriverProfile.objects.select_related('user').get(user_id=driver_id)
    except DriverProfile.DoesNotExist:
        return Response({
            'success': False,
            'error': {
                'code': 'NOT FOUND',
                'message': 'Thông tin tài xế không tồn tại'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = DriverStatsUpdateSerializer(data=request.data) #Cập nhật thống kê của tài xế
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Dữ liệu không hợp lệ',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if 'total_trips' in serializer.validated_data:
            driver_profile.total_trips = serializer.validated_data['total_trips']
        if 'total_earnings' in serializer.validated_data:
            driver_profile.total_earnings = serializer.validated_data['total_earnings']
        driver_profile.save()
        
        return Response({
            'success': True,
            'data': DriverProfileSerializer(driver_profile).data,
            'message': 'Cập nhật thống kê của tài xế thành công'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': {
                'code': 'SAVE_ERROR',
                'message': f'Lỗi khi lưu thông tin: {str(e)}'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)