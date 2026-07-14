from rest_framework import serializers
from farmers.models import Farmer
from .models import SeaweedProduction


class SeaweedProductionSerializer(serializers.ModelSerializer):
    farmer = serializers.PrimaryKeyRelatedField(queryset=Farmer.objects.all())

    class Meta:
        model = SeaweedProduction
        fields = "__all__"
