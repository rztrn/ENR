from django.db import migrations
import uuid

def gen_uuid(apps, schema_editor):
    VoyageReport = apps.get_model("ifs", "VoyageReport")
    for report in VoyageReport.objects.all():
        if not report.vesselActivityId:
            report.vesselActivityId = uuid.uuid4()
            report.save(update_fields=["vesselActivityId"])

class Migration(migrations.Migration):

    dependencies = [
        ("ifs", "0019_voyagereport_vesselactivityid"),
    ]

    operations = [
        migrations.RunPython(gen_uuid),
    ]
