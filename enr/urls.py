from django.urls import path, include
from .views import vessel_performance, vessel_seatrial, vessel_seatrial2, vessel_benchmark, vessel_factors
urlpatterns = [
    path("vessel-performance/", vessel_performance, name="vessel-performance"),
    path("vessel-benchmark/", vessel_benchmark, name="vessel-benchmark"),
    path("vessel-factors/", vessel_factors, name="vessel-factors"),
    path("vessel-seatrial/", vessel_seatrial, name="vessel-seatrial"),
    path("vessel-seatrial2/", vessel_seatrial2, name="vessel-seatrial2"),
]
