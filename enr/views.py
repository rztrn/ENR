from django.shortcuts import render

def vessel_seatrial(request):
    return render(request, "enr/vessel-seatrial.html")

def vessel_performance(request):
    return render(request, "enr/vessel-performance.html")



