from rest_framework.generics import CreateAPIView, ListCreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, FarmerSerializer
from .models import Farmer

User = get_user_model()

class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class FarmerListView(ListCreateAPIView):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]
