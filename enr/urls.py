from django.urls import path
from .views import vessel_performance_page
from api.views import VesselPerformanceAPIView

urlpatterns = [
    path("vessel-performance/", vessel_performance_page, name="vessel-performance"),
    path("api/vessel-performance/", VesselPerformanceAPIView.as_view(), name="vessel-performance-api"),
]