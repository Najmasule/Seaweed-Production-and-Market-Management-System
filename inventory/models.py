from django.db import models
from farmers.models import Farmer

class InventoryRecord(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE)
    item_name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    date_added = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.item_name} - {self.farmer.username}"
