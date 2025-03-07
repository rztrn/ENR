from django.shortcuts import render

# Create your views here.
def home(request):
    return render(request, "home.html")  # Ensure you have a 'home.html' template