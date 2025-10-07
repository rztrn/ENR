from django.urls import path
from .views import (
    ProtectedView, ParameterListAPIView, VesselListAPIView,
    ENRSingleParameterAPIView, ENRMultipleParameterAPIView, SeaTrialParameterAPIView, FilterOptionsView, DownloadExcelView, SeaTrialModelsAPIView, EnrComparisonAPIView, ENRFactorsAPIView,
    voyage_data, VoyageDataEngineFilteredView, VoyageDataDeckFilteredView, VoyageReportAPI, VoyageReportListAPI, VoyageReportForwardAPI, VoyageMASView, all_trips
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
    path('filters/', FilterOptionsView.as_view(), name='filters'),

    # Vessel Performance Endpoints
    path('performance/single/', ENRSingleParameterAPIView.as_view(), name='single-parameter'),
    path('performance/multiple/', ENRMultipleParameterAPIView.as_view(), name='multiple-parameter'),
    path('performance/factors/', ENRFactorsAPIView.as_view(), name='factor-parameter'),
    path('performance/benchmark/', EnrComparisonAPIView.as_view(), name='benchmarked-parameter'),
    path('performance/seatrial/', SeaTrialParameterAPIView.as_view(), name='seatrial-parameter'),
    path('model/seatrial/', SeaTrialModelsAPIView.as_view(), name='seatrial-model'),

    # Voyage
    path('voyage/', voyage_data, name='voyage_data'),
    path('voyage/details/', VoyageDataEngineFilteredView.as_view(), name='voyage_details'),
    path('voyage/details/deck/', VoyageDataDeckFilteredView.as_view(), name='voyage_details_deck'),

    # Trip
    path('trip/', all_trips, name='trip_data'),

    # MAS
    path("mas/", VoyageReportListAPI.as_view(), name="voyage-report-list"),
    path("mas2/", VoyageMASView.as_view(), name="voyage-mas-list"),
    path("mas/forward/", VoyageReportForwardAPI.as_view(), name="voyage-report-forward"),

    # API Schema & Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='api:schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='api:schema'), name='redoc'),

    # Extra Feature
    path("download-excel/", DownloadExcelView.as_view(), name="download_excel"),
]   

