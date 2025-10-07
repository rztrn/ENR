import os
import time as time_module
import pandas as pd
import numpy as np
from datetime import datetime, time as dt_time
from django.core.management.base import BaseCommand
from django.utils import timezone
from ifs.models import VoyageList, VoyageReport, VoyageDataEngine, VoyageDataDeck, VoyagePerformanceDetails, VesselList, VoyageSummary, VoyageRoute, TripSummary
from django.db import transaction
from django.db.models import Min, Max, Sum
from collections import defaultdict
from django.db import transaction
from services.forwarder import forward_voyage_report
from api.serializers import VoyageReportSerializer
from fleetsys.management.commands.summarize_to_voyage_summary import summarize_to_trip

# Define your folder path where the Excel files will be stored
FOLDER_PATH = r"C:\Users\Reza\Documents\IFS"

# Helper functions

def safe_float(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def time_to_minutes(t):
    if pd.isnull(t):
        return None
    if isinstance(t, dt_time):
        return t.hour * 60 + t.minute
    if isinstance(t, str):
        try:
            td = pd.to_timedelta(t)
            return int(td.total_seconds() // 60)
        except Exception as e:
            print(f"Error converting string {t}: {e}")
            return None
    if isinstance(t, pd.Timedelta):
        return int(t.total_seconds() // 60)
    return t


def extract_vessel_id_from_excel(filepath):
    df = pd.read_excel(
        filepath,
        sheet_name="Form_Engine",
        header=None,
        usecols="C",
        nrows=4
    )
    vessel_id = df.iloc[2, 0]
    print(f"Extracted Vessel ID: {vessel_id}")
    return vessel_id


def extract_voyage_number_from_excel(filepath):
    df = pd.read_excel(
        filepath,
        sheet_name="Form_Engine",
        header=None,
        usecols="C",
        nrows=5
    )
    voyage_number = df.iloc[3, 0]
    print(f"Extracted Voyage Number: {voyage_number}")
    return voyage_number


def get_or_create_voyage(vessel_id, voyage_number_val):
    voyage = VoyageList.objects.filter(
        vessel_id=vessel_id,
        voyage_number=voyage_number_val
    ).first()
    if not voyage:
        now = timezone.now()
        voyage = VoyageList.objects.create(
            vessel_id=vessel_id,
            voyage_number=voyage_number_val,
            start_datetime=now,
            end_datetime=now,
            status='active'
        )
    return voyage


def delete_existing_voyage_data(vessel_id, voyage_obj):
    VoyageReport.objects.filter(
        vessel_id=vessel_id,
        voyage_number_id=voyage_obj.id
    ).delete()
    VoyageDataEngine.objects.filter(
        voyage_report__voyage_number_id=voyage_obj.id
    ).delete()
    VoyageDataDeck.objects.filter(
        voyage_report__voyage_number_id=voyage_obj.id
    ).delete()


def bulk_insert_voyage_data(df, vessel_id, voyage_obj):
    # Loop through rows to preserve referential integrity
    for _, row in df.iterrows():
        report = VoyageReport.objects.create(
            vessel_id=vessel_id,
            voyage_number_id=voyage_obj.id,
            trip_number=row.get('trip_number'),
            date_time=row.get('date_time'),
            timezone=int(row.get('timezone') or 0),
            activity=row.get('activities'),
            step=row.get('step'),
            duration=row.get('duration'),
            loc_atfrom=row.get('loc_atfrom'),
            loc_to=row.get('loc_to')
        )

        VoyageDataEngine.objects.create(
            voyage_report=report,
            engine_merpm=row.get('engine_merpm'),
            engine_meload=row.get('engine_meload'),
            engine_proprpm=row.get('engine_proprpm'),
            engine_speed=row.get('engine_speed'),
            engine_propcpp=row.get('engine_propcpp'),
            me_fm_in=row.get('me_fm_in'),
            me_fm_out=row.get('me_fm_out'),
            me_fo_cons=row.get('me_fo_cons'),
            me_do_cons=row.get('me_do_cons'),
            me_cons_check=row.get('me_cons_check'),
            me_rh=row.get('me_rh'),
            boiler_fm_in=row.get('boiler_fm_in'),
            boiler_fm_out=row.get('boiler_fm_out'),
            boiler_fo_cons=row.get('boiler_fo_cons'),
            boiler_do_cons=row.get('boiler_do_cons'),
            boiler_cons_check=row.get('boiler_cons_check'),
            boiler_rh=row.get('boiler_rh'),
            aux_fm=row.get('aux_fm'),
            aux1_do_cons=row.get('aux1_do_cons'),
            aux2_do_cons=row.get('aux2_do_cons'),
            aux3_do_cons=row.get('aux3_do_cons'),
            aux_cons_check=row.get('aux_cons_check'),
            aux1_rh=row.get('aux1_rh'),
            aux2_rh=row.get('aux2_rh'),
            aux3_rh=row.get('aux3_rh'),
            cc1_do_cons=row.get('cc1_do_cons'),
            cc2_do_cons=row.get('cc2_do_cons'),
            cc3_do_cons=row.get('cc3_do_cons'),
            cc4_do_cons=row.get('cc4_do_cons'),
            cc5_do_cons=row.get('cc5_do_cons'),
            cc6_do_cons=row.get('cc6_do_cons'),
            cc1_rh=row.get('cc1_rh'),
            cc2_rh=row.get('cc2_rh'),
            cc3_rh=row.get('cc3_rh'),
            cc4_rh=row.get('cc4_rh'),
            cc5_rh=row.get('cc5_rh'),
            cc6_rh=row.get('cc6_rh'),
            eg_do_cons=row.get('eg_do_cons'),
            eg_rh=row.get('eg_rh'),
            bt_do_cons=row.get('bt_do_cons'),
            bt_rh=row.get('bt_rh'),
            other_fo_cons=row.get('other_fo_cons'),
            other_do_cons=row.get('other_do_cons'),
            total_fo_cons_in_kl=row.get('total_fo_cons_in_kl'),
            total_do_cons_in_kl=row.get('total_do_cons_in_kl'),
            fo_rob_in_kl=row.get('fo_rob_in_kl'),
            fo_fots=row.get('fo_fots'),
            fo_correction=row.get('fo_correction'),
            fo_supply=row.get('fo_supply'),
            fo_supply_type=row.get('fo_supply_type'),
            do_rob_in_kl=row.get('do_rob_in_kl'),
            do_fots=row.get('do_fots'),
            do_correction=row.get('do_correction'),
            do_supply=row.get('do_supply'),
            do_supply_type=row.get('do_supply_type'),
            fo_sg=row.get('fo_sg'),
            do_sg=row.get('do_sg'),
            total_fo_cons_in_mt=row.get('total_fo_cons_in_mt'),
            total_do_cons_in_mt=row.get('total_do_cons_in_mt'),
            fo_rob_in_mt=row.get('fo_rob_in_mt'),
            do_rob_in_mt=row.get('do_rob_in_mt')
        )

def bulk_insert_deck_data(df, vessel_id, voyage_obj):
    for _, row in df.iterrows():
        report = VoyageReport.objects.get(
            vessel_id=vessel_id,
            voyage_number_id=voyage_obj.id,
            date_time=row['date_time']
        )
        VoyageDataDeck.objects.create(
            voyage_report=report,
            fw_rob=row.get('fw_rob'),
            fw_supply = row.get('fw_supply'),
            fw_generated = row.get('fw_generated'),
            fw_consumption_pernoon = row.get('fw_consumption_pernoon'),
            fw_remarks = row.get('fw_remarks'),
            dwt_cargo_1_rob = row.get('dwt_cargo_1_rob'),
            dwt_cargo_1_type = row.get('dwt_cargo_1_type'),
            dwt_cargo_2_rob = row.get('dwt_cargo_2_rob'),
            dwt_cargo_2_type = row.get('dwt_cargo_2_type'),
            dwt_ballast_water = row.get('dwt_ballast_water'),
            dwt_constant = row.get('dwt_constant'),
            dwt_other = row.get('dwt_other'),
            dwt_total = row.get('dwt_total'),
            draft_f = row.get('draft_f'),
            draft_m = row.get('draft_m'),
            draft_a = row.get('draft_a'),
            hogsag = row.get('hogsag'),
            dist_lastport = row.get('dist_lastport'),
            dist_24hours = row.get('dist_24hours'),
            dist_togo = row.get('dist_togo'),
            speed_log = row.get('speed_log'),
            speed_gps = row.get('speed_gps'),
            speed_average = row.get('speed_average'),
            speed_slip = row.get('speed_slip'),
            coord_latdegree = row.get('coord_latdegree'),
            coord_latdecimal = row.get('coord_latdecimal'),
            coord_latq = row.get('coord_latq'),
            coord_longdegree = row.get('coord_longdegree'),
            coord_longdecimal = row.get('coord_longdecimal'),
            coord_longq = row.get('coord_longq'),
            coord_notes = row.get('coord_notes'),
            pos_hs = row.get('pos_hs'),
            pos_steering_rh = row.get('pos_steering_rh'),
            pos_barometer = row.get('pos_barometer'),
            pos_temperature = row.get('pos_temperature'),
            wind_dir = row.get('wind_dir'),
            wind_speed = row.get('wind_speed'),
            wind_bf_scale = row.get('wind_bf_scale'),
            wind_condition = row.get('wind_condition'),
            wave_height = row.get('wave_height'),
            wave_douglas_scale = row.get('wave_douglas_scale'),
            wave_state = row.get('wave_state'),
            wave_swell = row.get('wave_swell'),
            remarks = row.get('remarks'),
        )

def parse_voyage_excel_to_db(filepath, vessel_id, voyage_number_val):
    try:
        df = pd.read_excel(
            filepath,
            sheet_name="Form_Engine",
            header=None,
            skiprows=8,
            usecols="C:BU",
            nrows=150
        )

        df.columns = [
            'activities','vessel','voyage_number','trip_number','date_time','timezone','step','duration',
            'loc_atfrom','loc_to','engine_merpm','engine_meload','engine_proprpm','engine_speed','engine_propcpp',
            'me_fm_in','me_fm_out','me_fo_cons','me_do_cons','me_cons_check','me_rh','boiler_fm_in','boiler_fm_out',
            'boiler_fo_cons','boiler_do_cons','boiler_cons_check','boiler_rh','aux_fm','aux1_do_cons','aux2_do_cons',
            'aux3_do_cons','aux_cons_check','aux1_rh','aux2_rh','aux3_rh','cc1_do_cons','cc2_do_cons','cc3_do_cons',
            'cc4_do_cons','cc5_do_cons','cc6_do_cons','cc1_rh','cc2_rh','cc3_rh','cc4_rh','cc5_rh','cc6_rh',
            'eg_do_cons','eg_rh','bt_do_cons','bt_rh','other_fo_cons','other_do_cons','total_fo_cons_in_kl',
            'total_do_cons_in_kl','fo_rob_in_kl','fo_fots','fo_correction','fo_supply','fo_supply_type','do_rob_in_kl',
            'do_fots','do_correction','do_supply','do_supply_type','fo_sg','do_sg','total_fo_cons_in_mt','total_do_cons_in_mt',
            'fo_rob_in_mt','do_rob_in_mt'
        ]

        # Clean dataframe
        df = df.dropna(subset=['vessel','voyage_number']).drop(columns=['vessel','voyage_number'])
        df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
        df['timezone'] = df['timezone'].astype(int)

        # RH columns
        rh_cols = ['duration','bt_rh'] + [c for c in df.columns if c.endswith('_rh')]
        for col in rh_cols:
            df[col] = df[col].apply(time_to_minutes)

        # Numeric columns
        num_cols = [c for c in df.columns if c not in ['activities','trip_number','date_time','timezone','step','duration','loc_atfrom','loc_to']]
        for col in num_cols:
            df[col] = df[col].apply(safe_float)

        df = df.replace({np.nan: None})

        voyage_obj = get_or_create_voyage(vessel_id, voyage_number_val)
        delete_existing_voyage_data(vessel_id, voyage_obj)
        bulk_insert_voyage_data(df, vessel_id, voyage_obj)
        print(f"Finished Eng Form")

    except Exception as e:
        print(f"Error processing file {filepath}: {e}")

def parse_voyage_deck_to_db(filepath, vessel_id, voyage_number_val):
    df = pd.read_excel(
        filepath,
        sheet_name="Form_Deck",
        header=None,
        skiprows=8,              # same offsets you used before
        usecols="C:BH",          # adjust as needed
        nrows=150
    )
    
    eng_dt = pd.read_excel(
        filepath,
        sheet_name="Form_Engine",
        header=None,
        skiprows=8,
        usecols="E",      # column E was 'date_time' in your engine parser
        nrows=150
    )
    eng_dt.columns = ['date_time']
    eng_dt['date_time'] = pd.to_datetime(eng_dt['date_time'], errors='coerce')

    df.columns = [
        'activity','vessel','voyage_number','sail_no','date_time','timezone','step','duration','loc_atfrom','loc_to',
        'fw_rob','fw_supply','fw_generated','fw_consumption_pernoon','fw_remarks',
        'dwt_fo','dwt_do','dwt_lo','dwt_cargo_1_rob','dwt_cargo_1_type','dwt_cargo_2_rob','dwt_cargo_2_type','dwt_ballast_water','dwt_constant','dwt_other','dwt_total',
        'draft_f','draft_m','draft_a','hogsag',
        'dist_lastport','dist_24hours','dist_togo',
        'speed_engine','speed_log','speed_gps','speed_average','speed_slip',
        'coord_latdegree','coord_latdecimal','coord_latq','coord_longdegree','coord_longdecimal','coord_longq','coord_notes','pos_hs',
        'pos_steering_rh','pos_barometer','pos_temperature',
        'wind_dir','wind_speed','wind_bf_scale','wind_condition',
        'wave_height','wave_douglas_scale','wave_state','wave_swell','remarks',
    ]

    df = df.dropna(subset=['vessel','voyage_number']).drop(columns=['vessel','voyage_number'])
    df = df.drop(columns=['dwt_fo','dwt_do','dwt_lo','speed_engine','activity','vessel','voyage_number','sail_no','step','duration','loc_atfrom','loc_to'], errors='ignore')# drop, coerce, safe_float, etc., identical to your engine logic
    df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')

    df = df.replace({np.nan: None})

    voyage_obj = get_or_create_voyage(vessel_id, voyage_number_val)
    bulk_insert_deck_data(df, vessel_id, voyage_obj)
    print(f"Finished Deck Form")

def process_new_file(new_file):
    # Skip temporary Excel files
    if new_file.startswith('~$'):
        print(f"Skipping temporary file: {new_file}")
        return
    filepath = os.path.join(FOLDER_PATH, new_file)
    try:
        vessel_id = extract_vessel_id_from_excel(filepath)
        voyage_number_val = extract_voyage_number_from_excel(filepath)
        parse_voyage_excel_to_db(filepath, vessel_id, voyage_number_val)
        parse_voyage_deck_to_db(filepath, vessel_id, voyage_number_val)
    except Exception as e:
        print(f"Error in process_new_file for {new_file}: {e}")

def create_performance_entry(group, vessel, voyage, activity):
    start_time = group[0].voyage_report.date_time
    end_time   = group[-1].voyage_report.date_time
    calc_me_total_fo = sum((entry.me_fo_cons or 0) for entry in group)
    calc_me_total_do = sum((entry.me_do_cons or 0) for entry in group)
    calc_me_rh = sum((entry.me_rh or 0) for entry in group)

    return VoyagePerformanceDetails(
        vessel=vessel,
        voyage_number=voyage,
        activity=activity,
        start_time=start_time,
        end_time=end_time,
        me_fo_cons_in_kl=calc_me_total_fo,
        me_do_cons_in_kl=calc_me_total_do,
        me_rh=calc_me_rh
    ) 


def generate_voyage_performance(vessel, voyage):
    logs = (
        VoyageDataEngine.objects
        .filter(
            voyage_report__vessel_id=vessel.id,
            voyage_report__voyage_number_id=voyage.id
        )
        .select_related('voyage_report')
        .order_by('voyage_report__date_time')
    )
    if not logs.exists():
        return

    grouped_entries = []
    current_group = []
    prev_activity = None

    for entry in logs:
        activity = entry.voyage_report.activity
        if activity != prev_activity and current_group:
            grouped_entries.append(
                create_performance_entry(current_group, vessel, voyage, prev_activity)
            )
            current_group = []
        current_group.append(entry)
        prev_activity = activity

    # last block
    if current_group:
        grouped_entries.append(
            create_performance_entry(current_group, vessel, voyage, prev_activity)
        )

    with transaction.atomic():
        # wipe old for this voyage
        VoyagePerformanceDetails.objects.filter(
            vessel=vessel,
            voyage_number=voyage
        ).delete()
        VoyagePerformanceDetails.objects.bulk_create(grouped_entries)
    print(f"Generated performance details for vessel {vessel.id}, voyage {voyage.id}")

def summarize_to_voyage_summary(vessel, voyage):
    # pull all detail blocks for this voyage
    qs = VoyagePerformanceDetails.objects.filter(
        vessel=vessel,
        voyage_number=voyage
    )

    if not qs.exists():
        return None

    # overall start & end
    times = qs.aggregate(
        start_time=Min('start_time'),
        end_time=  Max('end_time'),
    )

    # overall sums
    totals = qs.aggregate(
        total_duration=Sum('me_rh'),
        total_fo_cons= Sum('me_fo_cons_in_kl'),
        total_do_cons= Sum('me_do_cons_in_kl'),
    )

    # sailing-only sums
    sail_qs = qs.filter(activity__iexact='sailing')
    sailing = sail_qs.aggregate(
        sailing_duration=Sum('me_rh'),
        sailing_fo_cons= Sum('me_fo_cons_in_kl'),
        sailing_do_cons= Sum('me_do_cons_in_kl'),
    )

    # coerce None→0
    summary_vals = {
        'vessel': vessel,
        'voyage_number': voyage,
        'start_time':    times['start_time'],
        'end_time':      times['end_time'],
        'total_duration': (totals['total_duration'] or 0),
        'total_fo_cons':  (totals['total_fo_cons']  or 0),
        'total_do_cons':  (totals['total_do_cons']  or 0),
        'sailing_duration': (sailing['sailing_duration'] or 0),
        'sailing_fo_cons':  (sailing['sailing_fo_cons']  or 0),
        'sailing_do_cons':  (sailing['sailing_do_cons']  or 0),
    }

    # upsert into VoyageSummary
    summary_obj, created = VoyageSummary.objects.update_or_create(
        vessel=vessel,
        voyage_number=voyage,
        defaults=summary_vals
    )
    return summary_obj

def generate_trip_summary(vessel, voyage):
    logs = (
        VoyageReport.objects
        .filter(
            vessel=vessel,
            voyage_number=voyage,
            trip_number__icontains="b"   # identify trip boundaries
        )
        .order_by("date_time")
    )

    if not logs.exists():
        return

    # Delete previous route + trip summaries for this voyage
    VoyageRoute.objects.filter(voyage=voyage).delete()
    TripSummary.objects.filter(vessel=vessel, voyage_number=voyage).delete()

    route_objs = []
    trip_numbers = set()

    for log in logs:
        # VoyageRoute entry
        route_objs.append(
            VoyageRoute(
                voyage=voyage,
                arrival_date=log.date_time,
                port_name=log.loc_atfrom,
                purpose=log.activity
            )
        )
        # collect distinct trip numbers
        try:
            trip_no = int(str(log.trip_number).rstrip("b"))
            trip_numbers.add(trip_no)
        except Exception:
            continue

    VoyageRoute.objects.bulk_create(route_objs)
    print(f"✅ Generated {len(route_objs)} voyage route entries.")

    # now run summarize_to_trip for each trip number
    for t in sorted(trip_numbers):
        summarize_to_trip(vessel, voyage, t)
    print(f"✅ Generated {len(trip_numbers)} trip summaries.")


class Command(BaseCommand):
    help = 'Monitor folder, process Excel files, and generate voyage performance.'

    def handle(self, *args, **options):
        processed_files = set(os.listdir(FOLDER_PATH))
        self.stdout.write("Monitoring started...")
        try:
            while True:
                current_files = set(os.listdir(FOLDER_PATH))
                new_files = current_files - processed_files
                for new_file in new_files:
                    if not new_file.lower().endswith(('.xls', '.xlsx')):
                        # mark non-Excel so it won’t be retried
                        processed_files.add(new_file)
                        continue

                    filepath = os.path.join(FOLDER_PATH, new_file)
                    self.stdout.write(f"Found new file: {new_file}")

                    try:
                        # Extract metadata
                        vessel_id = extract_vessel_id_from_excel(filepath)
                        voyage_number = extract_voyage_number_from_excel(filepath)

                        # Parse and insert data
                        parse_voyage_excel_to_db(filepath, vessel_id, voyage_number)
                        parse_voyage_deck_to_db(filepath, vessel_id, voyage_number)

                        # Fetch related objects
                        vessel_obj = VesselList.objects.get(id=vessel_id)
                        voyage_obj = VoyageList.objects.get(
                            vessel_id=vessel_id,
                            voyage_number=voyage_number
                        )

                        # Generate performance and summary
                        generate_voyage_performance(vessel_obj, voyage_obj)
                        generate_trip_summary(vessel_obj, voyage_obj)  # ✅ Your new function

                        summ = summarize_to_voyage_summary(vessel_obj, voyage_obj)
                        self.stdout.write(
                            f"⎯ VoyageSummary {'created' if summ else 'skipped'} "
                            f"for vessel {vessel_obj.id} voyage {voyage_obj.id}"
                        )

                        try:
                            forward_voyage_report(voyage_obj)  # send full voyage with Reports
                            self.stdout.write(f"✅ Forwarded Voyage {voyage_obj.voyage_number} ({voyage_obj.voyageUuid})")
                        except Exception as e:
                            self.stdout.write(f"❌ Failed to forward Voyage {voyage_obj.voyage_number}: {e}")

                        self.stdout.write(f"✅ Processed {new_file}") 
                    except Exception as e:
                        self.stdout.write(f"❌ Error processing {new_file}: {e}")
                    finally:
                        # No matter what, don’t retry this file
                        processed_files.add(new_file)

                time_module.sleep(10)
        except KeyboardInterrupt:
            self.stdout.write("Monitoring stopped by user.")