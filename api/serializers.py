from rest_framework import serializers
from enr.models import EnrParameter, SeaTrialParameter, ParameterList, VesselList, SeaTrialModels
from ifs.models import FuelOilType, VoyageList, VoyageDataEngine, CharterType, ChartererList, VoyageReport, VoyageDataDeck, VoyagePerformanceDetails, TripFuelSummary, TripSummary

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class ProtectedSerializer(serializers.Serializer):
    # Define fields based on what `protected_view` expects
    message = serializers.CharField(default="Access granted")

# GLOBAL SERIALIZER

class VesselListSerializer(serializers.ModelSerializer):
    class Meta:
        model = VesselList
        fields = [
            "id", 
            "vesselname"
        ]  # Specify the fields you need

class ParameterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterList
        fields = [
            'id', 
            'code', 
            'description'
        ]

# ENR SERIALIZER

class EnrParameterSerializer(serializers.ModelSerializer):
    # Ensures that the 'description' from the related ParameterList model is included
    description = serializers.CharField(source='parameter.description', read_only=True, default=None)
    
    class Meta:
        model = EnrParameter
        fields = [
            'vessel', 
            'date', 
            'movement', 
            'displacement', 
            'parameter', 
            'description', 
            'value'
        ]

# SEATRIAL SERIALIZER

class SeaTrialParameterSerializer(serializers.ModelSerializer):
    # Ensures that the 'description' from the related ParameterList model is included
    description = serializers.CharField(source='parameter.description', read_only=True, default=None)
    
    class Meta:
        model = SeaTrialParameter
        fields = [
            'vessel', 
            'session', 
            'timestamp', 
            'displacement', 
            'parameter', 
            'description', 
            'value'
        ]

class SeaTrialModelsSerializer(serializers.ModelSerializer):
    vessel_name = serializers.CharField(source='vessel.name', read_only=True)
    session_name = serializers.CharField(source='session.session_name', read_only=True)
    parameter_x_name = serializers.CharField(source='parameter_x.name', read_only=True)
    parameter_y_name = serializers.CharField(source='parameter_y.name', read_only=True)

    class Meta:
        model = SeaTrialModels
        fields = [
            'id',
            'vessel',
            'vessel_name',
            'session',
            'session_name',
            'model_type',
            'formula_type',
            'parameter_x',
            'parameter_x_name',
            'parameter_y',
            'parameter_y_name',
            'coefficient_a',
            'coefficient_b',
            'coefficient_c',
            'coefficient_determination',
            'created_at',
        ]

# IFS SERIALIZER 
class FuelOilTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelOilType
        fields = '__all__'

class CharterTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharterType
        fields = [
            'id',
            'name',
        ]

class ChartererListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartererList
        fields = [
            'id',
            'name',
        ]

class VoyageListSerializer(serializers.ModelSerializer):
    vesselId = serializers.IntegerField(source="vessel.id", read_only=True)
    charterTypeId = serializers.IntegerField(source="chartertype.id", read_only=True)
    chartererId = serializers.IntegerField(source="charterer.id", read_only=True)
    startDate = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    route = serializers.SerializerMethodField()
    trips = serializers.SerializerMethodField()

    vessel_id = serializers.PrimaryKeyRelatedField(
        queryset=VesselList.objects.all(), source="vessel", write_only=True
    )

    class Meta:
        model = VoyageList
        fields = [
            "id",
            "voyage_number",
            "vesselId",
            "vessel_id",
            "charterTypeId",
            "chartererId",
            "startDate",
            "status",
            "route",
            "trips",
        ]

    # ------------------
    # Latest trip activity
    def get_status(self, obj):
        latest = VoyagePerformanceDetails.objects.filter(
            voyage_number_id=obj.id, vessel=obj.vessel
        ).order_by("-start_time").first()
        return str(latest.activity) if latest else "No Activity"

    # ------------------
    # Latest trip start date
    def get_startDate(self, obj):
        latest = TripSummary.objects.filter(
            voyage_number_id=obj.id, vessel=obj.vessel
        ).order_by("-start_time").first()
        return latest.start_time if latest else None

    # ------------------
    # Route info
    def get_route(self, obj):
        routes = obj.route.all().order_by("arrival_date")  # related_name='route'
        return [
            {
                "portName": r.port_name,
                "visited": r.visited,
                "current": r.current,
                "arrivalDate": r.arrival_date,
                "purpose": r.purpose,
            }
            for r in routes
        ]

    # ------------------
    # Trips with fuel
    def get_trips(self, obj):
        trip_qs = TripSummary.objects.filter(
            voyage_number_id=obj.id, vessel=obj.vessel
        ).order_by("trip_number")
        return TripSummarySerializer(trip_qs, many=True).data


class TripFuelSummarySerializer(serializers.ModelSerializer):
    fuel_name = serializers.CharField(source="fuel_type.fueloil_name")

    class Meta:
        model = TripFuelSummary
        fields = ["fuel_name", "sounding_cons"]


class TripSummarySerializer(serializers.ModelSerializer):
    vessel_name = serializers.CharField(source="vessel.vesselname", read_only=True)
    voyage_number_val = serializers.IntegerField(source="voyage_number.voyage_number", read_only=True)
    fuelSummary = serializers.SerializerMethodField()

    class Meta:
        model = TripSummary
        fields = [
            "trip_number",
            "start_time",
            "end_time",
            "total_duration",
            "vessel_name",
            "voyage_number_val",
            "fuelSummary",
        ]

    def get_fuelSummary(self, obj):
        fuels = TripFuelSummary.objects.filter(trip=obj)
        return {f.fuel_type.fueloil_name: {"sounding_cons": f.sounding_cons} for f in fuels}


class VoyageReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoyageReport
        fields = '__all__'

class VoyageDataEngineSerializer(serializers.ModelSerializer):
    # Foreign key fields for write
    vessel_id = serializers.PrimaryKeyRelatedField(
        queryset=VesselList.objects.all(),
        source='vessel',
        write_only=True
    )
    voyage_number_id = serializers.PrimaryKeyRelatedField(
        queryset=VoyageList.objects.all(),
        source='voyage_number',
        write_only=True
    )
    voyage_report = serializers.PrimaryKeyRelatedField(queryset=VoyageReport.objects.all())

    # Flat VoyageReport fields
    vessel = serializers.CharField(source='voyage_report.vessel.name', read_only=True)
    voyage_number = serializers.CharField(source='voyage_report.voyage_number.number', read_only=True)
    trip_number = serializers.CharField(source='voyage_report.trip_number', read_only=True)
    date_time = serializers.DateTimeField(source='voyage_report.date_time', read_only=True)
    timezone = serializers.CharField(source='voyage_report.timezone', read_only=True)
    activity = serializers.CharField(source='voyage_report.activity', read_only=True)
    step = serializers.CharField(source='voyage_report.step', read_only=True)
    duration = serializers.FloatField(source='voyage_report.duration', read_only=True)
    loc_atfrom = serializers.CharField(source='voyage_report.loc_atfrom', read_only=True)
    loc_to = serializers.CharField(source='voyage_report.loc_to', read_only=True)

    class Meta:
        model = VoyageDataEngine
        fields = (
            'id',
            'vessel_id',
            'voyage_number_id',
            'voyage_report',

            # Flat voyage report data
            'vessel',
            'voyage_number',
            'trip_number',
            'date_time',
            'timezone',
            'activity',
            'step',
            'duration',
            'loc_atfrom',
            'loc_to',

            # Include all model fields
            *[f.name for f in VoyageDataEngine._meta.fields if f.name not in ('id', 'vessel', 'voyage_number', 'voyage_report')],
        )

class VoyageDataDeckSerializer(serializers.ModelSerializer):
    # Foreign key fields for write
    vessel_id = serializers.PrimaryKeyRelatedField(
        queryset=VesselList.objects.all(),
        source='vessel',
        write_only=True
    )
    voyage_number_id = serializers.PrimaryKeyRelatedField(
        queryset=VoyageList.objects.all(),
        source='voyage_number',
        write_only=True
    )
    voyage_report = serializers.PrimaryKeyRelatedField(queryset=VoyageReport.objects.all())

    # Flat VoyageReport fields
    vessel = serializers.CharField(source='voyage_report.vessel.name', read_only=True)
    voyage_number = serializers.CharField(source='voyage_report.voyage_number.number', read_only=True)
    date_time = serializers.DateTimeField(source='voyage_report.date_time', read_only=True)
    trip_number = serializers.CharField(source='voyage_report.trip_number', read_only=True)
    timezone = serializers.CharField(source='voyage_report.timezone', read_only=True)
    activity = serializers.CharField(source='voyage_report.activity', read_only=True)
    step = serializers.CharField(source='voyage_report.step', read_only=True)
    duration = serializers.FloatField(source='voyage_report.duration', read_only=True)
    loc_atfrom = serializers.CharField(source='voyage_report.loc_atfrom', read_only=True)
    loc_to = serializers.CharField(source='voyage_report.loc_to', read_only=True)

    class Meta:
        model = VoyageDataDeck
        fields = (
            'id',
            'vessel_id',
            'voyage_number_id',
            'voyage_report',

            # Flat voyage report data
            'vessel',
            'voyage_number',
            'date_time',
            'trip_number',
            'timezone',
            'activity',
            'step',
            'duration',
            'loc_atfrom',
            'loc_to',

            # Include all model fields
            *[f.name for f in VoyageDataDeck._meta.fields if f.name not in ('id', 'vessel', 'voyage_number', 'voyage_report')],
        )

#MAS API

class VoyageReportSerializer(serializers.ModelSerializer):
    DateTimeLocal = serializers.DateTimeField(source="date_time")
    TimeZone = serializers.IntegerField(source="timezone")

    Activity = serializers.CharField(source="step")
    Location = serializers.CharField(source="loc_atfrom", required=False, allow_null=True, allow_blank=True)

    CargoOnBoard = serializers.SerializerMethodField()

    Note = serializers.CharField(source="note", required=False, allow_null=True, allow_blank=True)
    Coordinate = serializers.CharField(source="coordinate", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = VoyageReport
        fields = [
            "DateTimeLocal",
            "TimeZone",
            "Activity",
            "Location",
            "Note",
            "CargoOnBoard",
            "Coordinate",
        ]

    def get_CargoOnBoard(self, obj):
        deck = VoyageDataDeck.objects.filter(voyage_report=obj).first()
        if deck:
            cargo1 = deck.dwt_cargo_1_rob or 0
            cargo2 = deck.dwt_cargo_2_rob or 0
            return cargo1 + cargo2
        return None

class VoyageListMASSerializer(serializers.ModelSerializer):
    voyageUuid = serializers.UUIDField(read_only=True)
    IdVesselIFS = serializers.PrimaryKeyRelatedField(
        source="vessel",
        queryset=VesselList.objects.all()
    )
    Voyage = serializers.IntegerField(source="voyage_number")
    FlagCharterType = serializers.SerializerMethodField()
    
    Reports = VoyageReportSerializer(
        source="voyagereport_set",  # reverse FK
        many=True,
        read_only=True
    )

    class Meta:
        model = VoyageList
        fields = [
            "voyageUuid",
            "IdVesselIFS",
            "Voyage",
            "FlagCharterType",
            "Reports",
        ] 

    def get_FlagCharterType(self, obj):
        if obj.chartertype:
            return obj.chartertype.id
        return None