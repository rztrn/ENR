from django.urls import path, include
from .views import ifs_home, voy_details, voy_menu, voy_summary, trip_summary
urlpatterns = [
    path("ifs-home/", ifs_home, name="ifs-home"),
    path("voy-details/", voy_details, name="voy-details"),
    path("voy-menu/", voy_menu, name="voy-menu"),
    path("voy-summary/", voy_summary, name="voy-summary"),
    path("trip-summary/", trip_summary, name="trip-summary")
]
