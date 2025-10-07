from rest_framework import generics, serializers, status
from rest_framework.generics import GenericAPIView
from django.contrib.auth import authenticate
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView 
from collections import defaultdict
from enr.models import EnrParameter, ParameterList, VesselList, SeaTrialParameter, SeaTrialModels, BenchmarkedEnrParameter
from ifs.models import FuelOilType, VoyageList, VoyageDataEngine, ChartererList, CharterType, VoyageDataDeck, VoyageReport
from .serializers import (
    EnrParameterSerializer,
    SeaTrialParameterSerializer,
    ParameterListSerializer,
    VesselListSerializer,
    LoginSerializer,
    SeaTrialModelsSerializer,
    CharterTypeSerializer,
    ChartererListSerializer,
    VoyageDataEngineSerializer,
    VoyageDataDeckSerializer,
    VoyageListSerializer,
    VoyageReportSerializer,
    VoyageListMASSerializer,
    TripSummary,
    TripSummarySerializer,
)
import pandas as pd
import requests
from django.http import HttpResponse
from collections import defaultdict

# 🔹 FIX: Explicitly declare the serializer for `protected_view`
class ProtectedViewSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = serializers.CharField()

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {"message": "You have access!", "user": request.user.username}
        serializer = ProtectedViewSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

class LoginView(GenericAPIView):
    serializer_class = LoginSerializer  # Ensure serializer is detected

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"]
        )

        if user:
            return Response({"message": "Login successful"})
        return Response({"error": "Invalid credentials"}, status=401)

# API View for listing parameters
class ParameterListAPIView(generics.ListAPIView):
    serializer_class = ParameterListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ParameterList.objects.all().order_by("code")

# API View for listing vessels
class VesselListAPIView(generics.ListAPIView):
    serializer_class = VesselListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VesselList.objects.all().order_by("id") 

# Base Pagination Class
class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Common Filtering Logic
class FilteredEnrParameterMixin:
    def get_filtered_queryset(self, base_queryset):
        selected_vessel = self.request.GET.get("vessel")
        selected_parameter = self.request.GET.get("parameter")
        selected_movement = self.request.GET.get("movement")
        selected_displacement = self.request.GET.get("displacement")
        start_date = self.request.GET.get("start_date")
        end_date = self.request.GET.get("end_date")

        if selected_vessel:
            base_queryset = base_queryset.filter(vessel=selected_vessel)
        if selected_parameter:
            base_queryset = base_queryset.filter(parameter=selected_parameter)
        if selected_movement:
            base_queryset = base_queryset.filter(movement=selected_movement)
        if selected_displacement:
            base_queryset = base_queryset.filter(displacement=selected_displacement)
        if start_date and end_date:
            base_queryset = base_queryset.filter(date__range=[start_date, end_date])

        return base_queryset

# Vessel-Performance
# Vessel Performance API View (Single Parameter)
class ENRSingleParameterAPIView(FilteredEnrParameterMixin, generics.ListAPIView):
    serializer_class = EnrParameterSerializer
    pagination_class = CustomPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.get_filtered_queryset(EnrParameter.objects.all()).order_by("date")

# Vessel Performance API View (Multiple Parameters)
class ENRMultipleParameterAPIView(FilteredEnrParameterMixin, generics.ListAPIView):
    serializer_class = EnrParameterSerializer
    pagination_class = CustomPagination  # Enable pagination for table
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.get_filtered_queryset(EnrParameter.objects.all())
        selected_parameters = self.request.GET.getlist("parameters")  
        if selected_parameters:
            queryset = queryset.filter(parameter__in=selected_parameters)  
        return queryset.order_by("-date")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        full_data_requested = request.GET.get("full_data") == "true"

        raw_data = list(queryset.values("vessel", "date", "movement", "displacement", "parameter", "value"))

        # Unpivoting data
        grouped_data = defaultdict(lambda: {"parameters": {}})
        for entry in raw_data:
            key = (entry["vessel"], entry["date"], entry["movement"], entry["displacement"])
            if key not in grouped_data:
                grouped_data[key] = {
                    "vessel": entry["vessel"],
                    "date": entry["date"],
                    "movement": entry["movement"],
                    "displacement": entry["displacement"],
                    "parameters": {}
                }
            grouped_data[key]["parameters"][f"parameter_{entry['parameter']}"] = entry["value"]

        formatted_data = []
        for key, value in grouped_data.items():
            formatted_entry = value.copy()
            formatted_entry.update(value["parameters"])
            del formatted_entry["parameters"]
            formatted_data.append(formatted_entry)

        if full_data_requested:
            # Return all data (for chart) without pagination
            return Response({"results": formatted_data})

        # Apply pagination for table
        page = self.paginate_queryset(formatted_data)
        if page is not None:  # Ensure pagination is applied correctly
            return self.get_paginated_response(page)

        # Fallback if pagination fails (shouldn't happen)
        return Response({"results": formatted_data})  


# Vessel Performance API View (Multiple Parameters)
class ENRFactorsAPIView(FilteredEnrParameterMixin, generics.ListAPIView):
    serializer_class = EnrParameterSerializer
    pagination_class = CustomPagination  # Enable pagination for table
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 1. Identify relevant dates where parameter "023003" is not null
        relevant_dates = EnrParameter.objects.filter(
            parameter__code="023003", value__isnull=False
        ).values_list("date", flat=True).distinct()

        # 2. Fetch all ENR parameters for those dates and ensure value is not null
        queryset = EnrParameter.objects.filter(
            date__in=relevant_dates, value__isnull=False
        )

        # 3. Optionally, apply additional preset filtering (by parameter code)
        preset_codes = ["020107","010001","021011","023003","010005","020103" ]  # Adjust as needed
        queryset = queryset.filter(parameter__code__in=preset_codes)

        # 4. Apply any additional filtering provided by the mixin
        queryset = self.get_filtered_queryset(queryset)
        
        # 5. Order the queryset (newest dates first)
        return queryset.order_by("-date")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        full_data_requested = request.GET.get("full_data") == "true"

        raw_data = list(queryset.values("vessel", "date", "movement", "displacement", "parameter__description", "value"))

        # Unpivoting data
        grouped_data = defaultdict(lambda: {"parameters": {}})
        for entry in raw_data:
            key = (entry["vessel"], entry["date"])
            if key not in grouped_data:
                grouped_data[key] = {
                    "vessel": entry["vessel"],
                    "date": entry["date"],
                    "movement": entry["movement"],
                    "displacement": entry["displacement"],
                    "parameters": {}
                }
            param_desc = entry.get("parameter__description", "Unknown")
            grouped_data[key]["parameters"][f"parameter_{param_desc}"] = entry["value"]

        formatted_data = []
        for key, value in grouped_data.items():
            formatted_entry = value.copy()
            formatted_entry.update(value["parameters"])
            del formatted_entry["parameters"]
            formatted_data.append(formatted_entry)

        if full_data_requested:
            # Return all data (for chart) without pagination
            return Response({"results": formatted_data})

        # Apply pagination for table
        page = self.paginate_queryset(formatted_data)
        if page is not None:  # Ensure pagination is applied correctly
            return self.get_paginated_response(page)

        # Fallback if pagination fails (shouldn't happen)
        return Response({"results": formatted_data}) 
    
class FilterOptionsView(APIView):
    def get(self, request):
        movements = EnrParameter.objects.values_list('movement', flat=True).distinct()
        displacements = EnrParameter.objects.values_list('displacement', flat=True).distinct()

        return Response({
            "movements": list(movements),
            "displacements": list(displacements)
        })
    
class DownloadExcelView(FilteredEnrParameterMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Generate an Excel file from vessel performance data with applied filters.
        Column headers for parameters will be replaced with parameter descriptions.
        """
        # Get filtered queryset
        queryset = self.get_filtered_queryset(EnrParameter.objects.all())
        selected_parameters = request.GET.getlist("parameters")
        if selected_parameters:
            queryset = queryset.filter(parameter__in=selected_parameters)

        # Sort by descending date
        queryset = queryset.order_by("-date")
        raw_data = list(queryset.values("vessel", "date", "movement", "displacement", "parameter", "value"))

        # Build a mapping of parameter id to its description
        # Assumes that ParameterList has 'id' and 'description' fields.
        parameter_mapping = dict(ParameterList.objects.values_list("id", "description"))

        # Unpivoting data (similar to your API view)
        grouped_data = defaultdict(lambda: {"parameters": {}})
        for entry in raw_data:
            key = (entry["vessel"], entry["date"], entry["movement"], entry["displacement"])
            if key not in grouped_data:
                grouped_data[key] = {
                    "vessel": entry["vessel"],
                    "date": entry["date"],
                    "movement": entry["movement"],
                    "displacement": entry["displacement"],
                    "parameters": {}
                }
            # Use raw parameter id as key for now
            grouped_data[key]["parameters"][f"parameter_{entry['parameter']}"] = entry["value"]

        formatted_data = []
        for key, value in grouped_data.items():
            formatted_entry = value.copy()
            # Rename parameter keys using the description mapping
            new_params = {}
            for k, v in value["parameters"].items():
                param_id = k.replace("parameter_", "")
                # Replace with description if available
                param_desc = parameter_mapping.get(int(param_id), k)
                new_params[param_desc] = v
            formatted_entry.update(new_params)
            del formatted_entry["parameters"]
            formatted_data.append(formatted_entry)

        # Convert formatted data to DataFrame
        df = pd.DataFrame(formatted_data)

        # Prepare Excel response
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="vessel_performance.xlsx"'

        # Write DataFrame to Excel using openpyxl engine
        with pd.ExcelWriter(response, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Performance Data", index=False)

        return response
    

# Vessel-Seatrial
class SeaTrialParameterAPIView(FilteredEnrParameterMixin, generics.ListAPIView):
    serializer_class = SeaTrialParameterSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return self.get_filtered_queryset(SeaTrialParameter.objects.all()).order_by("timestamp")


# Vessel-Seatrial Models
class SeaTrialModelsAPIView(FilteredEnrParameterMixin, generics.ListAPIView):
    serializer_class = SeaTrialModelsSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        queryset = SeaTrialModels.objects.all()
        model_type = self.request.query_params.get('model_type')
        if model_type:
            queryset = queryset.filter(model_type=model_type)
        return self.get_filtered_queryset(queryset)


class EnrComparisonAPIView(FilteredEnrParameterMixin, APIView):
    permission_classes = [IsAuthenticated]  # Add authentication if needed

    def get(self, request, *args, **kwargs):
        # Get all dates where parameter 023003 has a value
        relevant_dates = EnrParameter.objects.filter(
            parameter__code="023003", value__isnull=False
        ).values_list("date", flat=True).distinct()

        # Fetch all ENR parameters for the identified dates and apply filters
        enr_parameters = EnrParameter.objects.filter(date__in=relevant_dates, value__isnull=False)
        enr_parameters = self.get_filtered_queryset(enr_parameters)

        # Fetch all benchmarks in a single query (optimized)
        benchmark_entries = BenchmarkedEnrParameter.objects.filter(
            enr_parameter__date__in=relevant_dates
        ).select_related("enr_parameter")

        # Create a lookup dictionary for benchmarks { (vessel_id, parameter_id): benchmark_value }
        benchmark_lookup = {
            (entry.enr_parameter.vessel_id, entry.enr_parameter.parameter_id): entry.benchmarked_value
            for entry in benchmark_entries
        }

        response_data = {}

        for enr in enr_parameters:
            vessel_id = enr.vessel_id
            parameter_id = enr.parameter_id
            parameter_code = enr.parameter.code  # Example: 'RPM', 'Power', etc.

            # Fetch benchmark from lookup dictionary
            benchmark_value = benchmark_lookup.get((vessel_id, parameter_id))
            difference = enr.value - benchmark_value if benchmark_value is not None else None

            # Convert date to string (YYYY-MM-DD)
            date_str = enr.date.strftime("%Y-%m-%d")

            # Initialize structure for this date
            if date_str not in response_data:
                response_data[date_str] = {}

            # Store values under the parameter code
            response_data[date_str][parameter_code] = {
                "enr_value": enr.value,
                "benchmark": benchmark_value if benchmark_value is not None else "N/A",
                "difference": difference if difference is not None else "N/A",
            }

        return Response(response_data)
    
# ==== IFS ====
@api_view(['GET'])
def voyage_data(request):
    vessels = VesselList.objects.all()
    charterers = ChartererList.objects.all()
    charter_types = CharterType.objects.all()
    voyages = VoyageList.objects.all()

    vessel_serializer = VesselListSerializer(vessels, many=True)
    charterer_serializer = ChartererListSerializer(charterers, many=True)
    charter_type_serializer = CharterTypeSerializer(charter_types, many=True)
    voyage_serializer = VoyageListSerializer(voyages, many=True)

    data = {
        "vessels": vessel_serializer.data,
        "charterTypes": charter_type_serializer.data,
        "charterers": charterer_serializer.data,
        "voyages": voyage_serializer.data
    }

    return Response(data)

@api_view(["GET"])
def all_trips(request):
    # Filter trips by vessel name if provided
    vessel_name = request.GET.get("vessel")
    trips = TripSummary.objects.all()
    if vessel_name:
        trips = trips.filter(vessel__vesselname__icontains=vessel_name)

    trip_serializer = TripSummarySerializer(trips, many=True)

    # Include all filter data (same as /voyage)
    vessels = VesselList.objects.all()
    charterers = ChartererList.objects.all()
    charter_types = CharterType.objects.all()
    voyages = VoyageList.objects.all()

    vessel_serializer = VesselListSerializer(vessels, many=True)
    charterer_serializer = ChartererListSerializer(charterers, many=True)
    charter_type_serializer = CharterTypeSerializer(charter_types, many=True)
    voyage_serializer = VoyageListSerializer(voyages, many=True)

    data = {
        "trips": trip_serializer.data,
        "vessels": vessel_serializer.data,
        "charterTypes": charter_type_serializer.data,
        "charterers": charterer_serializer.data,
        "voyages": voyage_serializer.data,
    }

    return Response(data)
    

# views.py
class VoyageDataEngineFilteredView(APIView):
    def get(self, request, *args, **kwargs):
        voyage_id = request.query_params.get('voyage_id')

        if not voyage_id:
            return Response(
                {"detail": "voyage_id is a required query parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            voyage_id = int(voyage_id)
        except ValueError:
            return Response(
                {"detail": "voyage_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Now you can filter directly with voyage_id since it's unique
        queryset = VoyageDataEngine.objects.filter(
            voyage_report__voyage_number__id=voyage_id
        ).order_by('voyage_report__date_time')

        serializer = VoyageDataEngineSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class VoyageDataDeckFilteredView(APIView):
   def get(self, request, *args, **kwargs):
        # Pull from query string
        voyage_id = request.query_params.get('voyage_id')
 
        # Validate
        if not voyage_id:
            return Response(
                {"detail": "voyage_id is a required query parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            voyage_id = int(voyage_id)
        except ValueError:
            return Response(
                {"detail": "voyage_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter dynamically
        queryset = VoyageDataDeck.objects.filter(
            voyage_report__voyage_number__id=voyage_id
        ).order_by('voyage_report__date_time')

        serializer = VoyageDataDeckSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
   

class VoyageReportAPI(APIView):
    """
    API endpoint for creating voyage reports
    """
    def post(self, request, *args, **kwargs):
        serializer = VoyageReportSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            return Response(VoyageReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VoyageReportListAPI(APIView):
    """For Postman: check what’s in DB"""

    def get(self, request, *args, **kwargs):
        reports = VoyageReport.objects.all()
        serializer = VoyageReportSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class VoyageMASView(APIView):
    def get(self, request, *args, **kwargs):
        voyages = VoyageList.objects.all()
        serializer = VoyageListMASSerializer(voyages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class VoyageReportForwardAPI(APIView):
    """Forward saved reports to MASCRM"""

    def post(self, request, *args, **kwargs):
        reports = VoyageReport.objects.all()
        serializer = VoyageReportSerializer(reports, many=True)

        url = "http://www.mascrm.cloud:6499/api/VesselActivity/"
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(url, json=serializer.data, headers=headers, timeout=10)
            return Response({
                "forward_status": response.status_code,
                "forward_response": (
                    response.json()
                    if "application/json" in response.headers.get("Content-Type", "")
                    else response.text
                ),
                "sent_data": serializer.data  # optional: echo back the payload
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)