from django.urls import path
from .views import RegisterView, FarmerListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('farmers/', FarmerListView.as_view(), name='farmers'),
]
