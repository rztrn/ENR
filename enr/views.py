from django.shortcuts import render
from .models import EnrParameter

def vessel_performance_page(request):
    vessels = EnrParameter.objects.values_list("vessel", flat=True).distinct()  # Get unique vessel names
    parameters = EnrParameter.objects.values_list("parameter", flat=True).distinct()  # Get unique parameters

    return render(request, "enr/vessel_performance.html", {
        "vessels": vessels,
        "parameters": parameters,
    })
