from django.contrib import admin
from .models import EnrParameter, VesselList, ParameterList

@admin.register(EnrParameter)
class EnrParameterAdmin(admin.ModelAdmin):
    list_display = ('vessel', 'date', 'movement', 'displacement', 'parameter', 'value')
    search_fields = ('vessel', 'parameter')
    list_filter = ('date', 'parameter')

@admin.register(VesselList)
class VesselListAdmin(admin.ModelAdmin):
    list_display = ("id","vesselname", "description")  # Display columns in the list view
    search_fields = ("vesselname", "description")  # Enable search by vesselname and description
    ordering = ("id",)  # Order by vesselname

@admin.register(ParameterList)
class ParameterListAdmin(admin.ModelAdmin):
    list_display = ("code", "description")
    search_fields = ("code", "description")
    ordering = ("code",)