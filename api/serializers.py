from rest_framework import serializers
from enr.models import EnrParameter  # Import the model

class EnrParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnrParameter
        fields = '__all__'  # Best practice: List fields explicitly if needed
