from django.shortcuts import render

def parameter_correlation_page(request):
    return render(request, "enr/parameter-correlation.html")

def vessel_performance(request):
    return render(request, "enr/vessel-performance.html")



