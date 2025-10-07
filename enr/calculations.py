import math
from decimal import Decimal
from django.db import transaction
from enr.models import EnrParameter, BenchmarkedEnrParameter, ParameterList, VesselList, SeaTrialModels, SeaTrialSession

def enr_power_plan(vessel, date):
    """Calculate the power plan based on Pmax and RPM values."""
    
    # Fetch Pmax value (parameter code: 023003)
    pmax_value = EnrParameter.objects.filter(
        vessel=vessel, date=date, parameter__code="023003"
    ).values_list("value", flat=True).first()

    # Fetch main engine RPM value (parameter code: 010001)
    rpm_value = EnrParameter.objects.filter(
        vessel=vessel, date=date, parameter__code="010001"
    ).values_list("value", flat=True).first()

    # Ensure both parameters exist
    if pmax_value is None or rpm_value is None:
        return None  # Return None if any value is missing

    # Power Plan Calculation
    power_plan = pmax_value * 0.4 * math.pi * (0.32 / 2) ** 2 * (rpm_value / 60) / 120 * 8
    return power_plan


def forecast_exponent(vessel, power_plan):
    """Forecast the Exponent using Power Plan as the input (independent variable)."""

    # Get the first session for the vessel
    session = SeaTrialSession.objects.filter(vessel=vessel).order_by("id").first()
    if not session:
        return None  # No session available

    # Get the Sea Trial Model where Power Plan is the independent variable
    model = SeaTrialModels.objects.filter(
        vessel=vessel, session=session, model_type="exponent"
    ).first()

    if not model or power_plan is None:
        return None  # No model available or invalid input

    # Apply the regression formula
    if model.formula_type == "quadratic":
        # Quadratic Formula: exponent = ax² + bx + c
        forecasted_exponent = (
            model.coefficient_a * (power_plan ** 2) +
            (model.coefficient_b * power_plan if model.coefficient_b is not None else 0) +
            (model.coefficient_c if model.coefficient_c is not None else 0)
        )
    else:
        # Linear Formula: exponent = mx + b
        forecasted_exponent = (
            model.coefficient_a * power_plan +
            (model.coefficient_b if model.coefficient_b is not None else 0)
        )

    return forecasted_exponent

def enr_exponent(vessel, date):
    """Calculate the exponent for power calculation using forecasted exponent."""

    # Fetch power plan value
    power_plan = enr_power_plan(vessel, date)
    if power_plan is None:
        return None  # Return None if power plan is not available

    # Forecast the Exponent using the Sea Trial Model
    forecasted_exponent = forecast_exponent(vessel, power_plan)

    return forecasted_exponent


def save_benchmarked_values(vessel, date):
    """Calculate power plan, exponent, and power value, then save in BenchmarkedEnrParameter."""
    
    # Get required parameters
    power_plan_param = ParameterList.objects.get(code="020201")  # Power Plan
    exponent_param = ParameterList.objects.get(code="020202")    # Exponent
    power_param = ParameterList.objects.get(code="020107")       # Power

    # Fetch Pmax to check if parsing should trigger calculations
    pmax_exists = EnrParameter.objects.filter(
        vessel=vessel, date=date, parameter__code="023003", value__isnull=False
    ).exists()

    if not pmax_exists:
        print(f"No Pmax value found for {vessel} on {date}. Skipping calculations.")
        return

    # Calculate values
    power_plan = enr_power_plan(vessel, date)
    exponent = enr_exponent(vessel, date)
    # Ensure power_plan and exponent are valid (non-null and power_plan > 0)
    if power_plan is None or power_plan <= 0 or exponent is None:
        print(f"Invalid calculated values: power_plan={power_plan}, exponent={exponent}")
        return
    power_value = Decimal(power_plan) * (Decimal(10) ** Decimal(exponent))

    # Save the calculated parameters to BenchmarkedEnrParameter in an atomic transaction
    with transaction.atomic():
        # Save Power Plan
        if power_plan is not None:
            enr_power_plan_obj, _ = EnrParameter.objects.update_or_create(
                vessel=vessel, date=date, parameter=power_plan_param,
                defaults={"value": power_plan}
            )
            BenchmarkedEnrParameter.objects.update_or_create(
                enr_parameter=enr_power_plan_obj,
                defaults={"benchmarked_value": power_plan, "difference": None}  # No difference for forecasted values
            )

        # Save Exponent
        if exponent is not None:
            enr_exponent_obj, _ = EnrParameter.objects.update_or_create(
                vessel=vessel, date=date, parameter=exponent_param,
                defaults={"value": exponent}
            )
            BenchmarkedEnrParameter.objects.update_or_create(
                enr_parameter=enr_exponent_obj,
                defaults={"benchmarked_value": exponent, "difference": None}
            )

        # Save Power Value
        if power_value is not None:
            enr_power_obj, _ = EnrParameter.objects.update_or_create(
                vessel=vessel, date=date, parameter=power_param,
                defaults={"value": power_value}
            )
            BenchmarkedEnrParameter.objects.update_or_create(
                enr_parameter=enr_power_obj,
                defaults={"benchmarked_value": power_value, "difference": None}
            )

        print(f"Saved benchmarked values for {vessel} on {date}: Power Plan={power_plan}, Exponent={exponent}, Power={power_value}")