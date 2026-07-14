from rest_framework import serializers
from farmers.models import Farmer
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(queryset=Farmer.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Report
        fields = "__all__"
