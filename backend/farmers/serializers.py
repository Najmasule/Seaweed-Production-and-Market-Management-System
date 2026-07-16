<<<<<<< HEAD
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
=======
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Farmer, Inventory, Production, MarketPrices, Reports

class FarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = '__all__'

    def create(self, validated_data):
        # Kwenye model ya Farmer hakuna password, inasimamiwa na User model ya Django.
        # Hapa tunatengeneza tu profile ya Mkulima kawaida.
        return super().create(validated_data)


class InventorySerializer(serializers.ModelSerializer):
    # Tunachukua jina la mkulima kutoka kwenye profile ya Farmer
    farmer_name = serializers.ReadOnlyField(source='farmer.username')

    class Meta:
        model = Inventory
        fields = ['id', 'farmer', 'farmer_name', 'item_name', 'quantity', 'unit', 'updated_at']


class ProductionSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.username')

    class Meta:
        model = Production
        fields = ['id', 'farmer', 'farmer_name', 'seaweed_type', 'quantity_kg', 'harvest_date', 'status']


class MarketPricesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketPrices
        fields = '__all__'


class ReportsSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.ReadOnlyField(source='generated_by.username')

    class Meta:
        model = Reports
        fields = ['id', 'report_type', 'title', 'description', 'file_path', 'generated_by', 'generated_by_name', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=[('farmer', 'Farmer'), ('trader', 'Trader')], write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username hii tayari imeshatumika.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Barua pepe (Email) hii tayari imesajiliwa.")
        return value

    def create(self, validated_data):
        # Tenga role pembeni ili isilete shida wakati wa kutengeneza User wa Django
        role = validated_data.pop('role')
        
        # Tengeneza User mpya na ufiche password (hash) salama kabisa
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Kama mtumiaji amejisajili kama mkulima ('farmer'), mtengenezee profile yake
        if role == 'farmer':
            Farmer.objects.create(
                user=user,
                username=user.username  # Tunapitisha username ya mtumiaji hapa kwani ni field ya lazima kwenye Farmer model
            )
        
        # Kama ni 'trader', hapa unaweza kuongeza mantiki (kama una Trader model) 
        # au unaweza kuacha tu kwani User ameshatengenezwa na ana role ya Trader.
        
        return user
>>>>>>> 36422b4 (Initial commit for main branch)
