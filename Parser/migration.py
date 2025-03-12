from enr.models import EnrParameter, ParameterList

# Collect all unique parameter codes from EnrParameter
parameter_codes = EnrParameter.objects.values_list('parameter', flat=True).distinct()

# Add those codes to ParameterList if they don't exist
for code in parameter_codes:
    if not ParameterList.objects.filter(code=code).exists():
        # Optionally, you can set a description or leave it blank for now
        ParameterList.objects.create(code=code, description=f"Description for {code}")
        print(f"Added parameter {code} to ParameterList")