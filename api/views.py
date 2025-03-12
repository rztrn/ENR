from rest_framework import generics, serializers
from rest_framework.generics import GenericAPIView
from django.contrib.auth import authenticate
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from collections import defaultdict
from enr.models import EnrParameter, ParameterList, VesselList
from .serializers import (
    EnrParameterSerializer,
    ParameterListSerializer,
    VesselListSerializer,
    LoginSerializer,
)

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
    max_page_size = 20

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
    pagination_class = CustomPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.get_filtered_queryset(EnrParameter.objects.all())
        selected_parameters = self.request.GET.getlist("parameters")  # Get multiple parameters
        if selected_parameters:
            queryset = queryset.filter(parameter__in=selected_parameters)  # Ensure proper filtering
        return queryset.order_by("date")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
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

        return Response({"results": formatted_data})
    
class FilterOptionsView(APIView):
    def get(self, request):
        movements = EnrParameter.objects.values_list('movement', flat=True).distinct()
        displacements = EnrParameter.objects.values_list('displacement', flat=True).distinct()

        return Response({
            "movements": list(movements),
            "displacements": list(displacements)
        })