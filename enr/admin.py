from django.contrib import admin
from .models import EnrParameter

@admin.register(EnrParameter)
class EnrParameterAdmin(admin.ModelAdmin):
    list_display = ('vessel', 'date', 'movement', 'displacement', 'parameter', 'value')
    search_fields = ('vessel', 'parameter')
    list_filter = ('date', 'parameter')

