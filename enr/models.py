from django.db import models

# Create your models here.
class VesselList(models.Model):
    vesselname = models.CharField(max_length=20, unique=True)  # Parameter code (e.g., 010001)
    description = models.CharField(max_length=255)  # Description of the parameter (e.g., "Main Engine RPM")

    def __str__(self):
        return f"{self.vesselname} - {self.description}"

class ParameterList(models.Model):
    code = models.CharField(max_length=20, unique=True)  # Parameter code (e.g., 010001)
    description = models.CharField(max_length=255)  # Description of the parameter (e.g., "Main Engine RPM")

    def __str__(self):
        return f"{self.code} - {self.description}"
    
class EnrParameter(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    movement = models.CharField(max_length=50, null=True, blank=True)
    displacement = models.CharField(max_length=50, null=True, blank=True)
    parameter = models.ForeignKey(ParameterList, on_delete=models.SET_NULL, null=True, blank=True)
    value = models.FloatField()

    class Meta:
        unique_together = ('vessel', 'date', 'parameter')

