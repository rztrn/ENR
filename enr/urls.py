from django.urls import path, include
from .views import vessel_performance, vessel_seatrial
urlpatterns = [
    path("vessel-performance/", vessel_performance, name="vessel-performance"),
    path("vessel-seatrial/", vessel_seatrial, name="vessel-seatrial"),
]
