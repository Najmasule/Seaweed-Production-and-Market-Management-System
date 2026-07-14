from django.db import models

class InventoryRecord(models.Model):
    STATUS_CHOICES = (
        ("available", "Available"),
        ("reserved", "Reserved"),
        ("sold", "Sold"),
    )

    # null=True na blank=True hapa pia kuondoa kizuizi cha migration
    farmer_id = models.IntegerField(null=True, blank=True, help_text="ID ya Mkulima kutoka microservice ya Farmers")
    item_name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quality_grade = models.CharField(max_length=20, default="B")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    date_added = models.DateField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Inventory Record"
        verbose_name_plural = "Inventory Records"

    def __str__(self):
        return f"{self.item_name} - Farmer ID: {self.farmer_id}"