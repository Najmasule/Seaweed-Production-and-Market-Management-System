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
