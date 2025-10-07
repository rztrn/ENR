from django.core.management.base import BaseCommand
from ifs.models import VoyageDataEngine, VoyageReport

class Command(BaseCommand):
    help = "Backfill VoyageDataEngine.voyage_report ForeignKey based on vessel, voyage_number, and date_time."

    def handle(self, *args, **options):
        count = 0
        missing = 0

        engines = VoyageDataEngine.objects.all()

        for engine in engines:
            # Find the matching VoyageReport
            try:
                report = VoyageReport.objects.get(
                    vessel=engine.vessel,
                    voyage_number=engine.voyage_number,
                    date_time=engine.date_time
                )
                engine.voyage_report = report
                engine.save()
                count += 1
            except VoyageReport.DoesNotExist:
                missing += 1
                self.stdout.write(self.style.WARNING(
                    f"⚠️  No VoyageReport found for Vessel ID {engine.vessel_id}, Voyage Number ID {engine.voyage_number_id}, DateTime {engine.date_time}"
                ))

        self.stdout.write(self.style.SUCCESS(
            f"✅ Backfill complete. {count} records updated, {missing} missing."
        ))
