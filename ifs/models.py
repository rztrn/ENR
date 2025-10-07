from django.db import models
from enr.models import VesselList
import uuid

# Core Reference Model

class FuelOilType(models.Model):
    fueloil_name = models.CharField(max_length=20)

class LubOilType(models.Model):
    fueloil_name = models.CharField(max_length=20)

class CharterType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name    

class ChartererList(models.Model):
    name = models.CharField(max_length=100, default=1)
    abv = models.CharField(max_length=10)

    def __str__(self):
        return self.name

# Voyage & Trips
 
class VoyageList(models.Model):
    voyageUuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.IntegerField() #INTEGER
    chartertype = models.ForeignKey(CharterType, on_delete=models.CASCADE, default=1)
    charterer = models.ForeignKey(ChartererList, on_delete=models.CASCADE, default=1)
    start_datetime = models.DateTimeField() #UTC +0
    end_datetime = models.DateTimeField() #UTC +0
    status = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Voyage {self.id} - {self.status}"
    
class TripSummary(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.ForeignKey(VoyageList, on_delete=models.SET_NULL, null=True, blank=True)
    trip_number = models.IntegerField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    total_duration = models.FloatField()

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.vessel} Voyage {self.voyage_number} Trip {self.start_time.date()}"


# Fuel & Lubrication Oil Data

class VoyageSummary(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.ForeignKey(VoyageList, on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    total_duration = models.IntegerField()
    total_fo_cons = models.FloatField()
    total_do_cons = models.FloatField()
    sailing_duration = models.IntegerField()
    sailing_fo_cons = models.FloatField()
    sailing_do_cons = models.FloatField()
    
    class Meta:
        ordering = ['start_time']

class TripSummary(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.ForeignKey(VoyageList, on_delete=models.SET_NULL, null=True, blank=True)
    trip_number = models.IntegerField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    total_duration = models.FloatField()

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.vessel} Voyage {self.voyage_number} Trip {self.start_time.date()}"


class TripFuelSummary(models.Model):
    trip = models.ForeignKey(TripSummary, on_delete=models.CASCADE, related_name="fuel_summaries")
    fuel_type = models.ForeignKey("FuelOilType", on_delete=models.CASCADE)

    start_rob = models.FloatField(null=True, blank=True)
    end_rob = models.FloatField(null=True, blank=True)
    supply_qty = models.FloatField(null=True, blank=True)
    correction_qty = models.FloatField(null=True, blank=True)
    # Flowmeter-based (daily logging, controlling)
    flowmeter_cons = models.FloatField(null=True, blank=True)

    # Sounding-based (only start/end, evaluation)
    sounding_cons = models.FloatField(null=True, blank=True)
    class Meta:
        unique_together = ("trip", "fuel_type")

    def __str__(self):
        return f"{self.trip} - {self.fuel_type.fueloil_name}"

    
class VoyagePerformanceDetails(models.Model):
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.ForeignKey(VoyageList, on_delete=models.SET_NULL, null=True, blank=True)
    activity = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    me_fo_cons_in_kl = models.FloatField()
    me_do_cons_in_kl = models.FloatField()
    me_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    
    class Meta:
        ordering = ['start_time']

class VoyageReport(models.Model):
    vesselActivityId = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )
    vessel = models.ForeignKey(VesselList, on_delete=models.SET_NULL, null=True, blank=True)
    voyage_number = models.ForeignKey(VoyageList, on_delete=models.SET_NULL, null=True, blank=True)
    trip_number = models.CharField(max_length=3)
    date_time = models.DateTimeField()
    timezone = models.IntegerField()
    activity = models.CharField(max_length=20)
    step = models.CharField(max_length=20)
    duration = models.IntegerField()
    loc_atfrom = models.CharField(max_length=5, null=True, blank=True)
    loc_to = models.CharField(max_length=5, null=True, blank=True)

    class Meta:
        unique_together = ("vessel", "voyage_number", "date_time")

    def __str__(self):
        return f"{self.vessel} | {self.voyage_number} | {self.date_time}"

class VoyageRoute(models.Model):
    voyage = models.ForeignKey(VoyageList, related_name='route', on_delete=models.CASCADE)
    port_name = models.CharField(max_length=100)
    purpose = models.CharField(max_length=20)
    visited = models.BooleanField(default=False)
    current = models.BooleanField(default=False)
    arrival_date = models.DateTimeField()

    def __str__(self):
        return f"{self.port_name} - {self.arrival_date}" 

class LubOilData(models.Model):
    voyage_report = models.ForeignKey(VoyageReport, on_delete=models.CASCADE, null=True, blank=True)
    lo_type = models.ForeignKey(LubOilType, on_delete=models.CASCADE, null=True, blank=True)
    rob = models.FloatField(null=True, blank=True)
    supply = models.FloatField(null=True, blank=True)
    remarks = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        unique_together = ('voyage_report', 'lo_type')

    def __str__(self):
        return f"{self.lo_type} @ {self.report.timestamp}"

class VoyageDataEngine(models.Model):
    voyage_report = models.ForeignKey(VoyageReport, on_delete=models.CASCADE, null=True, blank=True)
    engine_merpm = models.FloatField(verbose_name="ME Engine RPM", null=True, blank=True)
    engine_meload = models.FloatField(verbose_name="ME Engine Load in kw", null=True, blank=True)
    engine_proprpm = models.FloatField(verbose_name="ME Engine Propeller RPM", null=True, blank=True)
    engine_speed = models.FloatField(verbose_name="ME Engine Speed", null=True, blank=True)
    engine_propcpp = models.FloatField(verbose_name="ME Engine Propeller CPP (if any)", null=True, blank=True)
    me_fm_in = models.IntegerField(verbose_name="ME Engine Flowmeter In Reading", null=True, blank=True)
    me_fm_out = models.IntegerField(verbose_name="ME Flowmeter Out Reading", null=True, blank=True)
    me_fo_cons = models.IntegerField(null=True, blank=True)
    me_do_cons = models.IntegerField(null=True, blank=True)
    me_cons_check = models.IntegerField(null=True, blank=True)
    me_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    boiler_fm_in = models.IntegerField(null=True, blank=True)
    boiler_fm_out = models.IntegerField(null=True, blank=True)
    boiler_fo_cons = models.IntegerField(null=True, blank=True)
    boiler_do_cons = models.IntegerField(null=True, blank=True)
    boiler_cons_check = models.IntegerField(null=True, blank=True)
    boiler_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    aux_fm = models.IntegerField(null=True, blank=True)
    aux1_do_cons = models.IntegerField(null=True, blank=True)
    aux2_do_cons = models.IntegerField(null=True, blank=True)
    aux3_do_cons = models.IntegerField(null=True, blank=True)
    aux_cons_check = models.IntegerField(null=True, blank=True)
    aux1_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    aux2_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    aux3_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc1_do_cons = models.IntegerField(null=True, blank=True)
    cc2_do_cons = models.IntegerField(null=True, blank=True)
    cc3_do_cons = models.IntegerField(null=True, blank=True)
    cc4_do_cons = models.IntegerField(null=True, blank=True)
    cc5_do_cons = models.IntegerField(null=True, blank=True)
    cc6_do_cons = models.IntegerField(null=True, blank=True)
    cc1_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc2_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc3_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc4_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc5_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    cc6_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    eg_do_cons = models.IntegerField(null=True, blank=True)
    eg_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    bt_do_cons = models.IntegerField(null=True, blank=True)
    bt_rh = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    other_fo_cons = models.IntegerField(null=True, blank=True)
    other_do_cons = models.IntegerField(null=True, blank=True)
    total_fo_cons_in_kl = models.FloatField(null=True, blank=True)
    total_do_cons_in_kl = models.FloatField(null=True, blank=True)
    fo_rob_in_kl = models.FloatField(null=True, blank=True)
    fo_fots = models.FloatField(null=True, blank=True)
    fo_correction = models.FloatField(null=True, blank=True)
    fo_supply = models.FloatField(null=True, blank=True)
    fo_supply_type = models.CharField(max_length=10, null=True, blank=True)
    do_rob_in_kl = models.FloatField(null=True, blank=True)
    do_fots = models.FloatField(null=True, blank=True)
    do_correction = models.FloatField(null=True, blank=True)
    do_supply = models.FloatField(null=True, blank=True)
    do_supply_type = models.CharField(max_length=10, null=True, blank=True)
    fo_sg = models.FloatField(null=True, blank=True)
    do_sg = models.FloatField(null=True, blank=True)
    total_fo_cons_in_mt = models.FloatField(null=True, blank=True)
    total_do_cons_in_mt = models.FloatField(null=True, blank=True)
    fo_rob_in_mt = models.FloatField(null=True, blank=True)
    do_rob_in_mt = models.FloatField(null=True, blank=True)
    remarks = models.CharField(max_length=100, null=True, blank=True)

class VoyageDataDeck(models.Model):
    voyage_report = models.ForeignKey(VoyageReport, on_delete=models.CASCADE, null=True, blank=True)
    fw_rob = models.FloatField(null=True, blank=True)
    fw_supply = models.FloatField(null=True, blank=True)
    fw_generated = models.FloatField(null=True, blank=True)
    fw_consumption_pernoon = models.FloatField(null=True, blank=True)
    fw_remarks = models.CharField(max_length=50, null=True, blank=True)
    dwt_cargo_1_rob = models.FloatField(null=True, blank=True)
    dwt_cargo_1_type = models.CharField(max_length=20, null=True, blank=True)
    dwt_cargo_2_rob = models.FloatField(null=True, blank=True)
    dwt_cargo_2_type = models.CharField(max_length=20, null=True, blank=True)
    dwt_ballast_water = models.FloatField(null=True, blank=True)
    dwt_constant = models.FloatField(null=True, blank=True)
    dwt_other = models.FloatField(null=True, blank=True)
    dwt_total = models.FloatField(null=True, blank=True)
    draft_f = models.FloatField(null=True, blank=True)
    draft_m = models.FloatField(null=True, blank=True)
    draft_a = models.FloatField(null=True, blank=True)
    hogsag = models.FloatField(null=True, blank=True)
    dist_lastport = models.FloatField(null=True, blank=True)
    dist_24hours = models.FloatField(null=True, blank=True)
    dist_togo = models.FloatField(null=True, blank=True)
    speed_log = models.FloatField(null=True, blank=True)
    speed_gps = models.FloatField(null=True, blank=True)
    speed_average = models.FloatField(null=True, blank=True)
    speed_slip = models.FloatField(null=True, blank=True)
    coord_latdegree = models.FloatField(null=True, blank=True)
    coord_latdecimal = models.FloatField(null=True, blank=True)
    coord_latq = models.CharField(max_length=5, null=True, blank=True)
    coord_longdegree = models.FloatField(null=True, blank=True)
    coord_longdecimal = models.FloatField(null=True, blank=True)
    coord_longq = models.CharField(max_length=5, null=True, blank=True)
    coord_notes = models.CharField(max_length=50, null=True, blank=True)
    pos_hs = models.IntegerField(null=True, blank=True)
    pos_steering_rh = models.IntegerField(null=True, blank=True)
    pos_barometer = models.FloatField(null=True, blank=True)
    pos_temperature = models.FloatField(null=True, blank=True)
    wind_dir = models.CharField(max_length=5, null=True, blank=True)
    wind_speed = models.FloatField(null=True, blank=True)
    wind_bf_scale = models.IntegerField(null=True, blank=True)
    wind_condition = models.CharField(max_length=20, null=True, blank=True)
    wave_height = models.FloatField(null=True, blank=True)
    wave_douglas_scale = models.IntegerField(null=True, blank=True)
    wave_state = models.CharField(max_length=20, null=True, blank=True)
    wave_swell = models.FloatField(null=True, blank=True)
    remarks = models.CharField(max_length=50, null=True, blank=True)
