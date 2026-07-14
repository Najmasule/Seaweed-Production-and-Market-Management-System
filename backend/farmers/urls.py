from django.urls import path
from .views import FarmerDetailView, FarmerListView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('farmers/', FarmerListView.as_view(), name='farmers'),
    path('farmers/<int:pk>/', FarmerDetailView.as_view(), name='farmer-detail'),
]
