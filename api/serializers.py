from rest_framework import serializers
from enr.models import EnrParameter, SeaTrialParameter, ParameterList, VesselList

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
        fields = ["id", "vesselname"]  # Specify the fields you need

class ParameterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterList
        fields = ['id', 'code', 'description']

# ENR SERIALIZER

class EnrParameterSerializer(serializers.ModelSerializer):
    # Ensures that the 'description' from the related ParameterList model is included
    description = serializers.CharField(source='parameter.description', read_only=True, default=None)
    
    class Meta:
        model = EnrParameter
        fields = ['vessel', 'date', 'movement', 'displacement', 'parameter', 'description', 'value']

# SEATRIAL SERIALIZER

class SeaTrialParameterSerializer(serializers.ModelSerializer):
    # Ensures that the 'description' from the related ParameterList model is included
    description = serializers.CharField(source='parameter.description', read_only=True, default=None)
    
    class Meta:
        model = SeaTrialParameter
        fields = ['vessel', 'session', 'timestamp', 'displacement', 'parameter', 'description', 'value']
