from rest_framework import serializers
from farmers.models import Farmer
from .models import InventoryRecord


class InventoryRecordSerializer(serializers.ModelSerializer):
    farmer = serializers.PrimaryKeyRelatedField(queryset=Farmer.objects.all())

    class Meta:
        model = InventoryRecord
        fields = "__all__"
