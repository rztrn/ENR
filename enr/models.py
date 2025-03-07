from django.db import models

# Create your models here.
class EnrParameter(models.Model):
    vessel = models.CharField(max_length=100)
    date = models.DateField()
    movement = models.CharField(max_length=50, null=True, blank=True)
    displacement = models.CharField(max_length=50, null=True, blank=True)
    parameter = models.CharField(max_length=20)
    value = models.FloatField()

    class Meta:
        unique_together = ('vessel', 'date', 'parameter')
