from django.urls import path
from .views import (
    ProtectedView, ParameterListAPIView, VesselListAPIView,
    ENRSingleParameterAPIView, ENRMultipleParameterAPIView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

app_name = "api"

urlpatterns = [
    # JWT Authentication Endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Authentication test endpoint
    path('protected/', ProtectedView.as_view(), name='protected'),

    # Parameter & Vessel Endpoints
    path('parameters/', ParameterListAPIView.as_view(), name='parameter-list'),
    path('vessels/', VesselListAPIView.as_view(), name='vessel-list'),

    # Vessel Performance Endpoints
    path('performance/single/', ENRSingleParameterAPIView.as_view(), name='single-parameter'),
    path('performance/multiple/', ENRMultipleParameterAPIView.as_view(), name='multiple-parameter'),

    # API Schema & Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='api:schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='api:schema'), name='redoc'),
]
