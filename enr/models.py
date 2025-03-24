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
    is_calculated = models.BooleanField(default=False)

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

class SeaTrialSession(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.CASCADE)
    session_name = models.CharField(max_length=100, unique=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vessel.name} - {self.session_name}"

class SeaTrialParameter(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey(SeaTrialSession, on_delete=models.CASCADE)
    timestamp = models.DateTimeField()
    displacement = models.CharField(max_length=50, null=True, blank=True)
    parameter = models.ForeignKey(ParameterList, on_delete=models.SET_NULL, null=True, blank=True)
    value = models.FloatField()

    class Meta:
        unique_together = ('vessel', 'session', 'timestamp', 'parameter')

    def __str__(self):
        return f"{self.vessel} - {self.session.session_name} - {self.parameter.description} at {self.timestamp}: {self.value}"

class SeaTrialModels(models.Model):
    FORMULA_CHOICES = [
        ("quadratic", "Quadratic (y = ax² + bx + c)"),
    ]

    MODEL_CHOICES = [
        ("internal", "FOC vs M/E Power"),
        ("external", "Ship Speed vs M/E Power"),
    ]

    vessel = models.ForeignKey(VesselList, on_delete=models.CASCADE)
    session = models.ForeignKey(SeaTrialSession, on_delete=models.CASCADE)
    model_type = models.CharField(max_length=20, choices=MODEL_CHOICES, default="internal")
    formula_type = models.CharField(max_length=20, choices=FORMULA_CHOICES, default="quadratic")

    # Explicit X (independent) and Y (dependent) variables
    parameter_x = models.ForeignKey(ParameterList, related_name="independent_models", on_delete=models.SET_NULL, null=True, blank=True)
    parameter_y = models.ForeignKey(ParameterList, related_name="dependent_models", on_delete=models.SET_NULL, null=True, blank=True)

    # Regression coefficients
    coefficient_a = models.FloatField()
    coefficient_b = models.FloatField(null=True, blank=True)
    coefficient_c = models.FloatField(null=True, blank=True)

    coefficient_determination = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vessel', 'session', 'model_type')

    def __str__(self):
        return f"{self.vessel.name} - {self.session.session_name} ({self.parameter_y.name} vs {self.parameter_x.name})"
