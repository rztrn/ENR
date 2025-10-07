import uuid
from django.db import migrations

def fix_duplicate_uuids(apps, schema_editor):
    VoyageList = apps.get_model("ifs", "VoyageList")
    seen = set()
    for voyage in VoyageList.objects.all():
        if not voyage.voyageUuid or voyage.voyageUuid in seen:
            voyage.voyageUuid = uuid.uuid4()
            voyage.save(update_fields=["voyageUuid"])
        seen.add(voyage.voyageUuid)

class Migration(migrations.Migration):

    dependencies = [
        ("ifs", "0023_populate_voyageuuid"),  # adjust to your last migration
    ]

    operations = [
        migrations.RunPython(fix_duplicate_uuids, reverse_code=migrations.RunPython.noop),
    ]