from django.urls import path, include
from .views import vessel_performance, vessel_seatrial, vessel_seatrial2
urlpatterns = [
    path("vessel-performance/", vessel_performance, name="vessel-performance"),
    path("vessel-seatrial/", vessel_seatrial, name="vessel-seatrial"),
    path("vessel-seatrial2/", vessel_seatrial2, name="vessel-seatrial2"),
]
