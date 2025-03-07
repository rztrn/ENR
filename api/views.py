from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from enr.models import EnrParameter
from .serializers import EnrParameterSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Protected Test Endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({
        "message": "You have access!",
        "user": request.user.username
    })

# Custom Pagination
class VesselPerformancePagination(PageNumberPagination):
    page_size = 50  # Default items per page
    page_size_query_param = 'page_size'  # Allow clients to specify page size
    max_page_size = 200  # Prevent excessive load

# Vessel Performance API View (With Authentication)
class VesselPerformanceAPIView(generics.ListAPIView):
    serializer_class = EnrParameterSerializer
    pagination_class = VesselPerformancePagination
    permission_classes = [IsAuthenticated]  # Enforce authentication

    def get_queryset(self):
        queryset = EnrParameter.objects.all()
        selected_vessel = self.request.GET.get("vessel")
        selected_parameter = self.request.GET.get("parameter")
        start_date = self.request.GET.get("start_date")
        end_date = self.request.GET.get("end_date")

        if selected_vessel:
            queryset = queryset.filter(vessel=selected_vessel)

        if selected_parameter:
            queryset = queryset.filter(parameter=selected_parameter)

        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        return queryset
