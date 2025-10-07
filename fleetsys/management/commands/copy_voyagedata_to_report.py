from django.core.management.base import BaseCommand
from ifs.models import VoyageDataEngine, VoyageReport

class Command(BaseCommand):
    help = "Copy data from VoyageDataEngine to VoyageReport"

    def handle(self, *args, **options):
        engines = VoyageDataEngine.objects.all()
        reports = []

        for engine in engines:
            report = VoyageReport(
                vessel=engine.vessel,
                voyage_number=engine.voyage_number,
                trip_number=engine.trip_number,
                date_time=engine.date_time,
                timezone=engine.timezone,
                activity=engine.activity,
                step=engine.step,
                duration=engine.duration,
                loc_atfrom=engine.loc_atfrom,
                loc_to=engine.loc_to,
                # add other fields you're migrating
            )
            reports.append(report)

        VoyageReport.objects.bulk_create(reports)
        self.stdout.write(self.style.SUCCESS(f"✅ Successfully copied {len(reports)} records to VoyageReport"))