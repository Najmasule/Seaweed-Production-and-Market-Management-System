from django.db import models
from django.utils import timezone
# Tunaimport Custom User kutoka kwenye app ya farmers
from farmers.models import User 

# 1. PROFILE YA TRADER
class TraderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="trader_profile")
    location = models.CharField(max_length=100, blank=True, null=True)
    company_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Trader Profile"
        verbose_name_plural = "Trader Profiles"
        db_table = "traders_trader_profile"

    def __str__(self):
        return f"Trader: {self.user.username}"


# 2. ORDERS ZA TRADER
class Order(models.Model):
    trader = models.ForeignKey(TraderProfile, on_delete=models.CASCADE, related_name="orders")
    product_type = models.CharField(max_length=50)
    quantity = models.FloatField()
    status = models.CharField(max_length=20, default="Pending")
    date_ordered = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order #{self.id} by {self.trader.user.username} ({self.product_type})"