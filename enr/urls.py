from django.urls import path, include
from .views import vessel_performance, parameter_correlation_page

urlpatterns = [
    path("vessel-performance/", vessel_performance, name="vessel-performance"),
    path("parameter-correlation/", parameter_correlation_page, name="parameter-correlation"),
]
