from rest_framework import generics
from .models import Farmer
from .serializers import FarmerSerializer, RegisterSerializer
from rest_framework.permissions import AllowAny

class RegisterView(generics.CreateAPIView):
    queryset = Farmer.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class FarmerListView(generics.ListAPIView):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
