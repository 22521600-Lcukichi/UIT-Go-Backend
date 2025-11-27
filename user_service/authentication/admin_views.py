"""
Admin Panel API Views

API endpoints cho admin quản lý hệ thống
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, Sum
from .models import User
from drivers.models import DriverProfile
from .serializers import UserSerializer
from drivers.serializers import DriverProfileSerializer


def is_admin(user):
    """Helper function kiểm tra user có phải admin không"""
    return user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    API lấy thống kê tổng quan cho admin dashboard
    GET /api/admin/dashboard/stats/
    
    Returns thống kê:
    - Tổng số users
    - Tổng số passengers
    - Tổng số drivers
    - Drivers đang chờ duyệt
    - Drivers đang online
    """
    # Kiểm tra quyền admin
    if not is_admin(request.user):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ admin mới có quyền truy cập'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Thống kê users
    total_users = User.objects.count()
    total_passengers = User.objects.filter(user_type='passenger').count()
    total_drivers = User.objects.filter(user_type='driver').count()
    
    # Thống kê drivers
    pending_drivers = DriverProfile.objects.filter(approval_status='pending').count()
    approved_drivers = DriverProfile.objects.filter(approval_status='approved').count()
    online_drivers = DriverProfile.objects.filter(
        approval_status='approved',
        is_online=True
    ).count()
    
    # Users mới trong 7 ngày
    from datetime import timedelta
    seven_days_ago = timezone.now() - timedelta(days=7)
    new_users_7days = User.objects.filter(created_at__gte=seven_days_ago).count()
    
    return Response({
        'success': True,
        'data': {
            'users': {
                'total': total_users,
                'passengers': total_passengers,
                'drivers': total_drivers,
                'new_last_7days': new_users_7days
            },
            'drivers': {
                'total': total_drivers,
                'pending_approval': pending_drivers,
                'approved': approved_drivers,
                'currently_online': online_drivers
            }
        },
        'message': 'Lấy thống kê thành công'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    """
    API lấy danh sách users (có phân trang và filter)
    GET /api/admin/users/
    
    Query params:
    - user_type: passenger/driver
    - is_active: true/false
    - search: tìm theo email/name
    - page: số trang
    - page_size: số items mỗi trang
    """
    # Kiểm tra quyền admin
    if not is_admin(request.user):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ admin mới có quyền truy cập'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Filter
    users = User.objects.all()
    
    user_type = request.query_params.get('user_type')
    if user_type:
        users = users.filter(user_type=user_type)
    
    is_active = request.query_params.get('is_active')
    if is_active:
        users = users.filter(is_active=is_active.lower() == 'true')
    
    search = request.query_params.get('search')
    if search:
        users = users.filter(
            Q(email__icontains=search) | Q(full_name__icontains=search)
        )
    
    # Phân trang
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    start = (page - 1) * page_size
    end = start + page_size
    
    total = users.count()
    users_page = users[start:end]
    
    serializer = UserSerializer(users_page, many=True)
    
    return Response({
        'success': True,
        'data': {
            'users': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total
            }
        },
        'message': 'Lấy danh sách users thành công'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_drivers(request):
    """
    API lấy danh sách drivers (có phân trang và filter)
    GET /api/admin/drivers/
    
    Query params:
    - approval_status: pending/approved/rejected/suspended
    - is_online: true/false
    - vehicle_type: bike/car_4seats/car_7seats
    - search: tìm theo email/name/license_plate
    """
    # Kiểm tra quyền admin
    if not is_admin(request.user):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ admin mới có quyền truy cập'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Filter
    drivers = DriverProfile.objects.select_related('user').all()
    
    approval_status = request.query_params.get('approval_status')
    if approval_status:
        drivers = drivers.filter(approval_status=approval_status)
    
    is_online = request.query_params.get('is_online')
    if is_online:
        drivers = drivers.filter(is_online=is_online.lower() == 'true')
    
    vehicle_type = request.query_params.get('vehicle_type')
    if vehicle_type:
        drivers = drivers.filter(vehicle_type=vehicle_type)
    
    search = request.query_params.get('search')
    if search:
        drivers = drivers.filter(
            Q(user__email__icontains=search) |
            Q(user__full_name__icontains=search) |
            Q(license_plate__icontains=search)
        )
    
    # Phân trang
    page = int(request.query_params.get('page', 1)) # Số trang (mặc định là 1)
    page_size = int(request.query_params.get('page_size', 20)) # Số items mỗi trang (mặc định là 20)
    start = (page - 1) * page_size # Vị trí bắt đầu
    end = start + page_size # Vị trí kết thúc
    
    total = drivers.count()
    drivers_page = drivers[start:end]
    
    serializer = DriverProfileSerializer(drivers_page, many=True)
    
    return Response({
        'success': True,
        'data': {
            'drivers': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total
            }
        },
        'message': 'Lấy danh sách drivers thành công'
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_approve_driver(request, driver_id):
    """
    API duyệt/từ chối driver
    PUT /api/admin/drivers/{driver_id}/approve/
    
    Body:
    {
        "action": "approve" | "reject" | "suspend",
        "approval_note": "Lý do..."
    }
    """
    # Kiểm tra quyền admin
    if not is_admin(request.user):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ admin mới có quyền truy cập'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        driver_profile = DriverProfile.objects.get(id=driver_id)
    except DriverProfile.DoesNotExist:
        return Response({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Không tìm thấy driver'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action')
    approval_note = request.data.get('approval_note', '')
    
    if action == 'approve':
        driver_profile.approval_status = 'approved'
        driver_profile.approved_at = timezone.now()
        driver_profile.approved_by = request.user.id
    elif action == 'reject':
        driver_profile.approval_status = 'rejected'
    elif action == 'suspend':
        driver_profile.approval_status = 'suspended'
    else:
        return Response({
            'success': False,
            'error': {
                'code': 'INVALID_ACTION',
                'message': 'Action không hợp lệ. Chỉ chấp nhận: approve, reject, suspend'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    driver_profile.approval_note = approval_note
    driver_profile.save()
    
    serializer = DriverProfileSerializer(driver_profile)
    
    return Response({
        'success': True,
        'data': {
            'driver': serializer.data
        },
        'message': f'Đã {action} driver thành công'
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    """
    API xóa user (soft delete)
    DELETE /api/admin/users/{user_id}/
    """
    # Kiểm tra quyền admin
    if not is_admin(request.user):
        return Response({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Chỉ admin mới có quyền truy cập'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Không tìm thấy user'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Soft delete: set is_active = False
    user.is_active = False
    user.save()
    
    return Response({
        'success': True,
        'data': {},
        'message': 'Xóa user thành công'
    }, status=status.HTTP_200_OK)

