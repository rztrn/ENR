import uuid
from django.db import migrations

def generate_uuids(apps, schema_editor):
    VoyageList = apps.get_model("ifs", "VoyageList")
    for voyage in VoyageList.objects.filter(voyageUuid__isnull=True):
        voyage.voyageUuid = uuid.uuid4()
        voyage.save(update_fields=["voyageUuid"])

class Migration(migrations.Migration):

    dependencies = [
        ("ifs", "0022_voyagelist_voyageuuid"),
    ]

    operations = [
        migrations.RunPython(generate_uuids, reverse_code=migrations.RunPython.noop),
    ]