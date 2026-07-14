from django.contrib import admin
from .models import Farmer, Production, MarketPrices, Inventory, Reports

# Register each model so it appears in Admin
@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "location", "phone", "role")
    search_fields = ("username", "email", "phone")

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ("farmer", "date", "quantity", "type")
    list_filter = ("type", "date")

@admin.register(MarketPrices)
class MarketPricesAdmin(admin.ModelAdmin):
    list_display = ("date", "product_type", "price", "demand_level")
    list_filter = ("product_type", "date")

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("farmer", "stock_level", "date_updated")
    list_filter = ("date_updated",)

@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    list_display = ("farmer", "production_summary", "market_summary", "date_generated")
    list_filter = ("date_generated",)
