from django.contrib import admin
# Tuna-import TraderProfile badala ya Trader wa zamani
from .models import TraderProfile, Order

@admin.register(TraderProfile)
class TraderProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "location", "created_at")
    search_fields = ("user__username", "company_name", "location")

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("trader", "product_type", "quantity", "status", "date_ordered")
    list_filter = ("status", "product_type")
    search_fields = ("trader__user__username", "product_type")