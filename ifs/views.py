from django.shortcuts import render

# Create your views here.
def ifs_home(request):
    return render(request, 'ifs/index.html')

def voy_details(request):
    return render(request, 'ifs/voyagedetails.html')

def voy_menu(request):
    return render(request, 'ifs/voyagemenu.html')

def voy_summary(request):
    return render(request, 'ifs/voyagesummary.html')

def trip_summary(request):
    return render(request, 'ifs/tripsummary.html')