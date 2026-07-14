from django.urls import path
from .views import InventoryRecordListCreateView, InventoryRecordDetailView

urlpatterns = [
    path("", InventoryRecordListCreateView.as_view(), name="inventory-list-create"),
    path("<int:pk>/", InventoryRecordDetailView.as_view(), name="inventory-detail"),
]
