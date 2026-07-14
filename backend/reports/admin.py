from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    # Hakikisha majina ya fields hapa chini yanaendana kabisa na yale yaliyopo kwenye models.py
    list_display = ('id', 'title', 'report_type', 'farmer_id', 'generated_at')
    list_filter = ('report_type', 'generated_at')
    search_fields = ('title', 'content')
    ordering = ('-generated_at',)
    readonly_fields = ('generated_at',)