import os
import time
import pandas as pd
import pymysql
from sqlalchemy import create_engine

# Folder to monitor
folder_path = r"C:\Users\Reza\Documents\Sea Trial"

# Track already processed files
processed_files = set(os.listdir(folder_path))

# MySQL connection settings
db_url = "mysql+pymysql://root:admin123@127.0.0.1:3306/fleetsys"
engine = create_engine(db_url)

def process_new_file(file_name):
    """Process a new Excel file and upsert data into MySQL."""
    file_path = os.path.join(folder_path, file_name)
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path, sheet_name="Sheet2", dtype={'Vessel': str})

        # Drop completely empty rows
        df = df.dropna(how='all')

        # Convert "Date" column to datetime format (force errors to NaT)
        df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')

        # Fill NaT values in the "Date" column with the previous row's date
        df['Timestamp'] = df['Timestamp'].ffill()

        # Melt the DataFrame to transform it into the desired format
        melted_df = df.melt(id_vars=['Vessel', 'Session', 'Timestamp', 'Displacement'], 
                             var_name='Parameter', 
                             value_name='Value')

        # Convert "Value" column to numeric, setting non-numeric values to NaN
        melted_df['Value'] = pd.to_numeric(melted_df['Value'], errors='coerce')

        # Log rows where Value was originally a string (optional, for debugging)
        invalid_values = melted_df[melted_df['Value'].isna()]
        if not invalid_values.empty:
            print(f"⚠️ Skipped {len(invalid_values)} rows due to non-numeric 'Value':")
            print(invalid_values[['Vessel', 'Session', 'Timestamp','Displacement', 'Parameter', 'Value']].head(5))  # Show first 5 invalid rows

        # Drop rows where Value is still NaN after conversion
        melted_df = melted_df.dropna(subset=['Value'])

        # Connect to MySQL using pymysql directly
        connection = pymysql.connect(
            host="127.0.0.1",
            user="root",
            password="admin123",
            database="fleetsys",
            cursorclass=pymysql.cursors.Cursor
        )

        with connection.cursor() as cursor:
            for row in melted_df.itertuples(index=False):
                vessel_id = row.Vessel  # Since Excel now sends "1" instead of "Sakti"
                parameter = row.Parameter

                # Check if Vessel ID exists in VesselList
                cursor.execute("SELECT id FROM enr_vessellist WHERE id = %s", (vessel_id,))
                vessel_result = cursor.fetchone()

                if not vessel_result:
                    print(f"⚠️ Skipping row because vessel_id {vessel_id} does not exist in VesselList")
                    continue  # Skip this row
                
                # Fetch or insert parameter
                cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (parameter,))
                param_result = cursor.fetchone()

                if not param_result:
                    cursor.execute("INSERT INTO enr_parameterlist (code, description, is_calculated) VALUES (%s, %s, %s)", 
                                   (parameter, f"Description for {parameter}", 0))
                    connection.commit()

                # Get parameter ID from ParameterList
                cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (parameter,))
                parameter_id = cursor.fetchone()[0]

                # Insert into SeaTrial
                cursor.execute("""
                INSERT INTO enr_seatrialparameter (vessel_id, session, timestamp, displacement, parameter_id, value)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    displacement = VALUES(displacement),
                    value = VALUES(value);
                """, (vessel_id, row.Session, row.Timestamp, row.Displacement, parameter_id, row.Value))

            connection.commit()

        connection.close()

        print(f"✅ Successfully imported into fleetsys.enr_enrparameter: {file_name}")

    except Exception as e:
        print(f"❌ Error processing {file_name}: {e}")

while True:
    # Check for new files
    current_files = set(os.listdir(folder_path))
    new_files = current_files - processed_files  # Detect new files
    
    for new_file in new_files:
        if new_file.endswith(".xlsx"):  # Only process Excel files
            process_new_file(new_file)
            processed_files.add(new_file)  # Mark as processed
    
    time.sleep(10)  # Check every 10 seconds
