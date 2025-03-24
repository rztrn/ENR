from rest_framework import serializers
from enr.models import EnrParameter, SeaTrialParameter, ParameterList, VesselList, SeaTrialModels

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
