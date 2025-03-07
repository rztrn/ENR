from django.urls import path
from .views import VesselPerformanceAPIView, protected_view
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Vessel Performance API (Requires Authentication)
    path('vessel-performance/', VesselPerformanceAPIView.as_view(), name='vessel-performance-api'),

    # Authentication test endpoint
    path('protected/', protected_view, name='protected'),

    # JWT Authentication Endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
