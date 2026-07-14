from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Farmer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    # Fani hizi zinatengenezwa hapa ili kupokea data kutoka kwenye Form ya Frontend
    name = serializers.CharField(write_only=True, required=True)
    contact = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # Hizi ndizo fields zinazoonekana kwenye fomu ya usajili sasa hivi
        fields = ["id", "name", "username", "location", "contact", "password", "role"]
        read_only_fields = ["id"]

    def validate_role(self, value):
        # Tunazuia uwezekano wa mtu kujisajili kama Admin kupitia API ya kawaida
        allowed_roles = ["farmer", "trader"]
        if value not in allowed_roles:
            raise serializers.ValidationError("Role lazima iwe 'farmer' au 'trader' pekee.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        
        # 1. Tenganisha 'name' kwenda first_name na last_name
        full_name = validated_data.pop("name")
        name_parts = full_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # 2. Toa 'contact' ili tuihifadhi kwenye uwanja wa 'phone' wa database yetu
        contact = validated_data.pop("contact")
        
        # 3. Tengeneza na uhifadhi mtumiaji mpya kwenye database
        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            first_name=first_name,
            last_name=last_name,
            location=validated_data.get("location", ""),
            phone=contact,  # contact inakaa kwenye colum ya phone ya database
            role=validated_data.get("role", "farmer"),
        )
        return user


class FarmerSerializer(serializers.ModelSerializer):
    # Tunahakikisha hata kwenye kusoma data (GET), 'phone' inarudi ikiwa imeandikwa 'contact'
    contact = serializers.CharField(source="phone", read_only=True)

    class Meta:
        model = Farmer
        fields = ["id", "username", "email", "first_name", "last_name", "location", "contact", "role"]