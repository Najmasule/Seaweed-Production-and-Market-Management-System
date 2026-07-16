<<<<<<< HEAD
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, FarmerSerializer
from .models import Farmer
from seaweed_system.api_cache import CachedDetailAPIView, CachedListCreateAPIView

User = get_user_model()

class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class FarmerListView(CachedListCreateAPIView):
    queryset = Farmer.objects.all()
    cache_key = "api:farmers:list"

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RegisterSerializer
        return FarmerSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated()]


class FarmerDetailView(CachedDetailAPIView):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:farmers:list"
=======
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from rest_framework import viewsets, permissions
from .models import Farmer, Inventory, Production, MarketPrices, Reports
from .serializers import (
    FarmerSerializer, 
    InventorySerializer, 
    ProductionSerializer, 
    MarketPricesSerializer, 
    ReportsSerializer
)

class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
    permission_classes = [permissions.AllowAny] # Badili kuwa IsAuthenticated baada ya majaribio ya kwanza

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = self.queryset
        farmer_id = self.request.query_params.get('farmer_id')
        if farmer_id:
            queryset = queryset.filter(farmer_id=farmer_id)
        return queryset

class ProductionViewSet(viewsets.ModelViewSet):
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = self.queryset
        farmer_id = self.request.query_params.get('farmer_id')
        if farmer_id:
            queryset = queryset.filter(farmer_id=farmer_id)
        return queryset

class MarketPricesViewSet(viewsets.ModelViewSet):
    queryset = MarketPrices.objects.all()
    serializer_class = MarketPricesSerializer
    permission_classes = [permissions.AllowAny]

class ReportsViewSet(viewsets.ModelViewSet):
    queryset = Reports.objects.all()
    serializer_class = ReportsSerializer
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # Inaruhusu mtu yeyote kufungua bila login
    serializer_class = RegisterSerializer   
>>>>>>> 36422b4 (Initial commit for main branch)
