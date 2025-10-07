import os
import time
import pandas as pd
import pymysql
from sqlalchemy import create_engine

from django.core.management.base import BaseCommand
from django.conf import settings

# Import your Django models and functions
from enr.models import VesselList, EnrParameter
from enr.calculations import save_benchmarked_values

class Command(BaseCommand):
    help = "Process new ENR Excel files and trigger benchmark calculations."

    def handle(self, *args, **options):
        # Folder to monitor (could also be set in settings)
        folder_path = r"C:\Users\Reza\Documents\ENR"
        
        # Track already processed files
        processed_files = set(os.listdir(folder_path))
        
        # MySQL connection settings (kept unchanged)
        db_url = "mysql+pymysql://root:admin123@127.0.0.1:3306/fleetsys"
        engine = create_engine(db_url)
        
        self.stdout.write(self.style.SUCCESS("Starting ENR file processing..."))
        
        while True:
            current_files = set(os.listdir(folder_path))
            new_files = current_files - processed_files  # Detect new files

            for new_file in new_files:
                if new_file.endswith(".xlsx"):
                    self.process_new_file(folder_path, new_file)
                    processed_files.add(new_file)
                    
            time.sleep(10)  # Check every 10 seconds

    def process_new_file(self, folder_path, file_name):
        file_path = os.path.join(folder_path, file_name)
        try:
            # Read Excel file
            df = pd.read_excel(file_path, sheet_name="Sheet3", dtype={'Vessel': str})
            df = df.dropna(how='all')
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            df['Date'] = df['Date'].ffill()
            
            # Melt the DataFrame into long format
            melted_df = df.melt(id_vars=['Vessel', 'Date', 'Movement', 'Displacement'], 
                                var_name='Parameter', 
                                value_name='Value')
            melted_df['Value'] = pd.to_numeric(melted_df['Value'], errors='coerce')
            
            invalid_values = melted_df[melted_df['Value'].isna()]
            if not invalid_values.empty:
                self.stdout.write(
                    f"⚠️ Skipped {len(invalid_values)} rows due to non-numeric 'Value'"
                )
                self.stdout.write(str(invalid_values[['Vessel', 'Date', 'Parameter', 'Value']].head(5)))
                
            melted_df = melted_df.dropna(subset=['Value'])
            
            # Connect to MySQL using pymysql
            connection = pymysql.connect(
                host="127.0.0.1",
                user="root",
                password="admin123",
                database="fleetsys",
                cursorclass=pymysql.cursors.Cursor
            )
            
            with connection.cursor() as cursor:
                for row in melted_df.itertuples(index=False):
                    vessel_id = row.Vessel  # Excel provides the vessel ID (e.g., "1")
                    parameter = row.Parameter

                    # Check if Vessel ID exists in VesselList
                    cursor.execute("SELECT id FROM enr_vessellist WHERE id = %s", (vessel_id,))
                    vessel_result = cursor.fetchone()
                    if not vessel_result:
                        self.stdout.write(
                            f"⚠️ Skipping row because vessel_id {vessel_id} does not exist"
                        )
                        continue
                    
                    # Fetch or insert parameter into ParameterList
                    cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (parameter,))
                    param_result = cursor.fetchone()
                    if not param_result:
                        cursor.execute("INSERT INTO enr_parameterlist (code, description) VALUES (%s, %s)", 
                                       (parameter, f"Description for {parameter}"))
                        connection.commit()
                    
                    # Get parameter ID from ParameterList
                    cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (parameter,))
                    parameter_id = cursor.fetchone()[0]
                    
                    # Insert into EnrParameter table
                    cursor.execute("""
                        INSERT INTO enr_enrparameter (vessel_id, date, movement, displacement, parameter_id, value)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                            movement = VALUES(movement),
                            displacement = VALUES(displacement),
                            value = VALUES(value);
                    """, (vessel_id, row.Date, row.Movement, row.Displacement, parameter_id, row.Value))
                connection.commit()
            connection.close()
            
            self.stdout.write(self.style.SUCCESS(f"✅ Successfully imported: {file_name}"))
            
            # Trigger benchmark calculation for each distinct (vessel, date) pair from the file
            distinct_keys = melted_df[['Vessel', 'Date']].drop_duplicates()
            for vessel_id, date in distinct_keys.itertuples(index=False, name=None):
                # Check if there is at least one Pmax value for this vessel and date (parameter code "023003")
                pmax_exists = EnrParameter.objects.filter(
                    vessel__id=vessel_id, date=date, parameter__code="023003", value__isnull=False
                ).exists()
                if pmax_exists:
                    try:
                        vessel_obj = VesselList.objects.get(id=vessel_id)
                        save_benchmarked_values(vessel_obj, date)
                        self.stdout.write(
                            self.style.SUCCESS(f"Benchmarked values saved for Vessel {vessel_obj} on {date}")
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f"❌ Error saving benchmarks for vessel {vessel_id} on {date}: {e}")
                        )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error processing {file_name}: {e}"))
