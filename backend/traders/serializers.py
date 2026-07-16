from rest_framework import serializers
from .models import Trader, Order

class TraderRegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=True)
    contact = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Trader
        fields = ["id", "name", "username", "location", "contact", "password", "company_name"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        
        # Tenganisha jina kamili kutoka frontend kwenda first_name na last_name
        full_name = validated_data.pop("name")
        name_parts = full_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # contact inahifadhiwa kwenye phone
        contact = validated_data.pop("contact")

        trader = Trader.objects.create_user(
            username=validated_data["username"],
            password=password,
            first_name=first_name,
            last_name=last_name,
            location=validated_data.get("location", ""),
            phone=contact,
            company_name=validated_data.get("company_name", "")
        )
        return trader


class TraderSerializer(serializers.ModelSerializer):
    contact = serializers.CharField(source="phone", read_only=True)

    class Meta:
        model = Trader
        fields = ["id", "username", "email", "first_name", "last_name", "location", "contact", "company_name"]


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["id", "trader", "product_type", "quantity", "status", "date_ordered"]
        read_only_fields = ["id", "trader", "status", "date_ordered"]