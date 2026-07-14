from django.urls import path
from .views import SeaweedProductionListCreateView, SeaweedProductionDetailView

urlpatterns = [
    path("", SeaweedProductionListCreateView.as_view(), name="production-list-create"),
    path("<int:pk>/", SeaweedProductionDetailView.as_view(), name="production-detail"),
]
