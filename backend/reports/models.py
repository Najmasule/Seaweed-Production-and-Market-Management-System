from django.db import models

class Report(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    
    # Tukiongeza null=True na blank=True, Django haitakuuliza swali la default terminalini!
    generated_at = models.DateTimeField(auto_now_add=True, null=True, blank=True) 
    
    report_type = models.CharField(max_length=50, default='general')
    farmer_id = models.BigIntegerField(null=True, blank=True)
    created_by_id = models.BigIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.report_type})"