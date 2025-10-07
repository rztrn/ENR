from django.db.models import Min, Max, Sum
from ifs.models import VoyagePerformanceDetails, TripSummary, VoyageSummary, VoyageDataEngine, FuelOilType, TripFuelSummary, VoyageReport


def summarize_to_trip(vessel, voyage, trip_no):
    """
    trip_no: integer or numeric-like (1, 2, ...)
    Trip start is the VoyageReport row with trip_number == '{trip_no}B'
    Trip end (for sounding) is the VoyageReport row with trip_number == '{trip_no+1}B'
    Flowmeter sums:
      - Skip the first row (opening boundary)
      - Include the last row (closing boundary)
    """
    # --- Normalize trip number ---
    try:
        t_int = int(trip_no)
    except Exception:
        t_int = int(str(trip_no).rstrip('b').rstrip('B'))

    start_label = f"{t_int}B"
    next_label = f"{t_int + 1}B"

    # --- Find trip boundaries ---
    start_report = VoyageReport.objects.filter(
        vessel=vessel,
        voyage_number=voyage,
        trip_number__iexact=start_label
    ).order_by("date_time").first()

    if not start_report:
        return None

    next_report = VoyageReport.objects.filter(
        vessel=vessel,
        voyage_number=voyage,
        trip_number__iexact=next_label
    ).order_by("date_time").first()

    # --- Engine logs between boundaries ---
    if next_report:
        trip_engine_logs = VoyageDataEngine.objects.filter(
            voyage_report__vessel=vessel,
            voyage_report__voyage_number=voyage,
            voyage_report__date_time__gte=start_report.date_time,
            voyage_report__date_time__lte=next_report.date_time,  # <= include closing
        ).select_related("voyage_report").order_by("voyage_report__date_time")
    else:
        trip_engine_logs = VoyageDataEngine.objects.filter(
            voyage_report__vessel=vessel,
            voyage_report__voyage_number=voyage,
            voyage_report__date_time__gte=start_report.date_time,
        ).select_related("voyage_report").order_by("voyage_report__date_time")

    logs_list = list(trip_engine_logs)

    # --- Flowmeter calculation (skip first, include closing) ---
    def flowmeter_sum(field_name):
        if len(logs_list) < 2:
            return 0
        return sum((getattr(logs_list[i], field_name) or 0) for i in range(1, len(logs_list)))

    fo_flowmeter_cons = flowmeter_sum("total_fo_cons_in_kl")
    do_flowmeter_cons = flowmeter_sum("total_do_cons_in_kl")

    # --- Duration ---
    total_duration = sum((l.me_rh or 0) for l in logs_list)

    # --- Supply & corrections ---
    fo_supply = sum((l.fo_supply or 0) for l in logs_list)
    fo_correction = sum((l.fo_correction or 0) for l in logs_list)
    do_supply = sum((l.do_supply or 0) for l in logs_list)
    do_correction = sum((l.do_correction or 0) for l in logs_list)

    # --- Start & end logs for ROB ---
    start_engine = VoyageDataEngine.objects.filter(voyage_report=start_report).first()
    if next_report:
        end_engine = VoyageDataEngine.objects.filter(voyage_report=next_report).first()
        end_time = next_report.date_time
    else:
        end_engine = logs_list[-1] if logs_list else None
        end_time = end_engine.voyage_report.date_time if end_engine else start_report.date_time

    start_fo_rob = getattr(start_engine, "fo_rob_in_kl", None) if start_engine else None
    end_fo_rob = getattr(end_engine, "fo_rob_in_kl", None) if end_engine else None
    start_do_rob = getattr(start_engine, "do_rob_in_kl", None) if start_engine else None
    end_do_rob = getattr(end_engine, "do_rob_in_kl", None) if end_engine else None

    # --- Sounding calculation ---
    sounding_fo = ((start_fo_rob or 0) - (end_fo_rob or 0)) + fo_supply + fo_correction
    sounding_do = ((start_do_rob or 0) - (end_do_rob or 0)) + do_supply + do_correction

    # --- Upsert TripSummary ---
    trip_summary, _ = TripSummary.objects.update_or_create(
        vessel=vessel,
        voyage_number=voyage,
        trip_number=t_int,
        defaults={
            "start_time": start_report.date_time,
            "end_time": end_time,
            "total_duration": total_duration,
        }
    )

    # --- Upsert TripFuelSummary ---
    fuel_items = {
        "FO": {
            "start_rob": start_fo_rob,
            "end_rob": end_fo_rob,
            "supply_qty": fo_supply,
            "correction_qty": fo_correction,
            "flowmeter_cons": fo_flowmeter_cons,
            "sounding_cons": sounding_fo,
        },
        "DO": {
            "start_rob": start_do_rob,
            "end_rob": end_do_rob,
            "supply_qty": do_supply,
            "correction_qty": do_correction,
            "flowmeter_cons": do_flowmeter_cons,
            "sounding_cons": sounding_do,
        },
    }

    for fuel_name, vals in fuel_items.items():
        fuel_key = str(fuel_name).upper()
        fuel_type, _ = FuelOilType.objects.get_or_create(fueloil_name=fuel_key)

        TripFuelSummary.objects.update_or_create(
            trip=trip_summary,
            fuel_type=fuel_type,
            defaults=vals
        )

    return trip_summary



def summarize_to_voyage(vessel, voyage):
    trips = TripSummary.objects.filter(
        vessel=vessel,
        voyage_number=voyage
    )

    if not trips.exists():
        return None

    times = trips.aggregate(
        start_time=Min('start_time'),
        end_time=Max('end_time'),
    )

    totals = trips.aggregate(
        total_duration=Sum('total_duration'),
        total_fo_cons=Sum('total_fo_cons'),
        total_do_cons=Sum('total_do_cons'),
        total_distance=Sum('total_distance'),
        sailing_duration=Sum('sailing_duration'),
        sailing_fo_cons=Sum('sailing_fo_cons'),
        sailing_do_cons=Sum('sailing_do_cons'),
    )

    summary_vals = {
        'start_time': times['start_time'],
        'end_time': times['end_time'],
        'total_duration': totals['total_duration'] or 0,
        'total_fo_cons': totals['total_fo_cons'] or 0,
        'total_do_cons': totals['total_do_cons'] or 0,
        'total_distance': totals['total_distance'] or 0,
        'sailing_duration': totals['sailing_duration'] or 0,
        'sailing_fo_cons': totals['sailing_fo_cons'] or 0,
        'sailing_do_cons': totals['sailing_do_cons'] or 0,
        'total_trips': trips.count(),
    }

    voyage_summary, created = VoyageSummary.objects.update_or_create(
        vessel=vessel,
        voyage_number=voyage,
        defaults=summary_vals
    )
    return voyage_summary
