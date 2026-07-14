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
