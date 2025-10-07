import os
import time as time_module
import pandas as pd
import numpy as np  # <-- make sure this is added
import pymysql
from datetime import datetime, time
import pickle

# Define your folder path where the Excel files will be stored
folder_path = r"C:\Users\Reza\Documents\IFS"

# Initialize the processed_files set
processed_files = set(os.listdir(folder_path))

# Database connection context manager
def get_db_connection():
    return pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="admin123",
        database="fleetsys",
        cursorclass=pymysql.cursors.DictCursor
    )

def parse_voyage_excel_to_db(filepath, vessel_id, voyage_number):
    def safe_float(val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    def time_to_minutes(t):
        if pd.isnull(t):
            return None
        if isinstance(t, time):
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

    try:
        df = pd.read_excel(
            filepath,
            sheet_name="Form_Engine",
            header=None,
            skiprows=8,
            usecols="C:BU",
            nrows=150
        )

        df.columns = ['activities', 'vessel', 'voyage_number', 'trip_number', 'date_time', 'timezone', 'step', 'duration', 'loc_atfrom', 'loc_to', 
                      'engine_merpm', 'engine_meload', 'engine_proprpm', 'engine_speed', 'engine_propcpp', 'me_fm_in', 'me_fm_out', 'me_fo_cons', 
                      'me_do_cons', 'me_cons_check', 'me_rh', 'boiler_fm_in', 'boiler_fm_out', 'boiler_fo_cons', 'boiler_do_cons', 'boiler_cons_check', 
                      'boiler_rh', 'aux_fm', 'aux1_do_cons', 'aux2_do_cons', 'aux3_do_cons', 'aux_cons_check', 'aux1_rh', 'aux2_rh', 'aux3_rh', 
                      'cc1_do_cons', 'cc2_do_cons', 'cc3_do_cons', 'cc4_do_cons', 'cc5_do_cons', 'cc6_do_cons', 'cc1_rh', 'cc2_rh', 'cc3_rh', 
                      'cc4_rh', 'cc5_rh', 'cc6_rh', 'eg_do_cons', 'eg_rh', 'bt_do_cons', 'bt_rh', 'other_fo_cons', 'other_do_cons', 'total_fo_cons_in_kl', 
                      'total_do_cons_in_kl', 'fo_rob_in_kl', 'fo_fots', 'fo_correction', 'fo_supply', 'fo_supply_type', 'do_rob_in_kl', 'do_fots', 
                      'do_correction', 'do_supply', 'do_supply_type', 'fo_sg', 'do_sg', 'total_fo_cons_in_mt', 'total_do_cons_in_mt', 'fo_rob_in_mt', 'do_rob_in_mt']

        df = df.dropna(subset=['vessel', 'voyage_number'])
        df = df.drop(columns=['vessel', 'voyage_number'])

        df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
        df['timezone'] = df['timezone'].astype(str)

        # RH columns (in minutes)
        rh_columns = ['duration', 'bt_rh'] + [col for col in df.columns if col.endswith('_rh')]
        for col in rh_columns:
            df[col] = df[col].apply(time_to_minutes)

        # Numeric columns to be converted with safe_float
        numeric_columns = [
            'engine_merpm', 'engine_meload', 'engine_proprpm', 'engine_speed', 'engine_propcpp',
            'me_fm_in', 'me_fm_out', 'me_fo_cons', 'me_do_cons', 'me_cons_check',
            'boiler_fm_in', 'boiler_fm_out', 'boiler_fo_cons', 'boiler_do_cons', 'boiler_cons_check',
            'aux_fm', 'aux1_do_cons', 'aux2_do_cons', 'aux3_do_cons', 'aux_cons_check',
            'cc1_do_cons', 'cc2_do_cons', 'cc3_do_cons', 'cc4_do_cons', 'cc5_do_cons', 'cc6_do_cons',
            'eg_do_cons', 'bt_do_cons', 'other_fo_cons', 'other_do_cons',
            'total_fo_cons_in_kl', 'total_do_cons_in_kl', 'fo_rob_in_kl', 'fo_fots', 'fo_correction', 'fo_supply',
            'do_rob_in_kl', 'do_fots', 'do_correction', 'do_supply', 'fo_sg', 'do_sg',
            'total_fo_cons_in_mt', 'total_do_cons_in_mt', 'fo_rob_in_mt', 'do_rob_in_mt'
        ]
        for col in numeric_columns:
            if col in df.columns:
                df[col] = df[col].apply(safe_float)

        df = df.replace({np.nan: None})

        # Log any invalid date_time
        invalid_dates = df[df['date_time'].isna()]
        if not invalid_dates.empty:
            print(f"Invalid date entries:\n{invalid_dates}")

        # Log invalid durations
        invalid_duration = df[df['duration'].isna()]
        if not invalid_duration.empty:
            print(f"Invalid values in 'duration':\n{invalid_duration}")

        # Get or create voyage
        voyage_id = get_voyage_id(vessel_id, voyage_number)
        if not voyage_id:
            voyage_id = create_voyage(vessel_id, voyage_number)

        print(df)

        delete_existing_voyage_data(vessel_id, voyage_id)
        bulk_insert_voyage_data(df, vessel_id, voyage_id)

    except Exception as e:
        print(f"Error processing file {filepath}: {e}")

def get_voyage_id(vessel_id, voyage_number):
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id FROM ifs_voyagelist WHERE vessel_id = %s AND voyage_number = %s", (vessel_id, voyage_number))
                result = cursor.fetchone()
                return result['id'] if result else None
    except Exception as e:
        print(f"Error fetching voyage ID: {e}")
        return None

def create_voyage(vessel_id, voyage_number):
    try:
        now = datetime.now()
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO ifs_voyagelist (vessel_id, voyage_number, start_datetime, end_datetime) 
                    VALUES (%s, %s, %s, %s)
                """, (vessel_id, voyage_number, now, now))
                connection.commit()
                cursor.execute("SELECT LAST_INSERT_ID()")
                return cursor.fetchone()['LAST_INSERT_ID()']
    except Exception as e:
        print(f"Error creating voyage: {e}")
        return None

def delete_existing_voyage_data(vessel_id, voyage_id):
    tables = [
        'ifs_voyagereport',
        'ifs_voyagedataengine'
        # Add any additional tables you've separated out
    ]
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                for table in tables:
                    query = f"DELETE FROM {table} WHERE vessel_id = %s AND voyage_number_id = %s"
                    cursor.execute(query, (vessel_id, voyage_id))
                connection.commit()
    except Exception as e:
        print(f"Error deleting existing voyage data: {e}")

def bulk_insert_voyage_data(df, vessel_id, voyage_id):
    voyage_number_id = voyage_id
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                # Insert data into ifs_voyagereport and get the voyagereport_id
                for _, row in df.iterrows():
                    # Create a tuple of values to insert into ifs_voyagereport
                    report_values = (
                        row['trip_number'], 
                        row['date_time'], 
                        row['timezone'], 
                        row['activities'], 
                        row['step'], 
                        row['duration'], 
                        row['loc_atfrom'], 
                        row['loc_to'],
                        vessel_id,  # Ensure the correct vessel_id is passed
                        voyage_id,   # Ensure the correct voyage_id is passed
                    )

                    # Insert into ifs_voyagereport
                    cursor.execute("""
                        INSERT INTO ifs_voyagereport 
                        (
                            trip_number, 
                            date_time, 
                            timezone, 
                            activities, 
                            step, 
                            duration, 
                            loc_atfrom, 
                            loc_to,
                            vessel_id,
                            voyage_id,
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, report_values)

                    # Get the voyagereport_id of the last inserted record
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    voyagereport_id = cursor.fetchone()[0]

                    # Create a tuple of values to insert into ifs_voyagedataengine, including the foreign key
                    dataengine_values = (
                        row['engine_merpm'], 
                        row['engine_meload'], 
                        row['engine_proprpm'], 
                        row['engine_speed'], 
                        row['engine_propcpp'], 
                        row['me_fm_in'], 
                        row['me_fm_out'], 
                        row['me_fo_cons'], 
                        row['me_do_cons'], 
                        row['me_cons_check'], 
                        row['me_rh'], 
                        row['boiler_fm_in'], 
                        row['boiler_fm_out'], 
                        row['boiler_fo_cons'], 
                        row['boiler_do_cons'], 
                        row['boiler_cons_check'], 
                        row['boiler_rh'], 
                        row['aux_fm'], 
                        row['aux1_do_cons'], 
                        row['aux2_do_cons'], 
                        row['aux3_do_cons'], 
                        row['aux_cons_check'], 
                        row['aux1_rh'], 
                        row['aux2_rh'], 
                        row['aux3_rh'], 
                        row['cc1_do_cons'], 
                        row['cc2_do_cons'], 
                        row['cc3_do_cons'], 
                        row['cc4_do_cons'], 
                        row['cc5_do_cons'], 
                        row['cc6_do_cons'], 
                        row['cc1_rh'], 
                        row['cc2_rh'], 
                        row['cc3_rh'], 
                        row['cc4_rh'], 
                        row['cc5_rh'], 
                        row['cc6_rh'], 
                        row['eg_do_cons'], 
                        row['eg_rh'], 
                        row['bt_do_cons'], 
                        row['bt_rh'], 
                        row['other_fo_cons'], 
                        row['other_do_cons'], 
                        row['total_fo_cons_in_kl'], 
                        row['total_do_cons_in_kl'], 
                        row['fo_rob_in_kl'], 
                        row['fo_fots'], 
                        row['fo_correction'], 
                        row['fo_supply'], 
                        row['fo_supply_type'], 
                        row['do_rob_in_kl'], 
                        row['do_fots'], 
                        row['do_correction'], 
                        row['do_supply'], 
                        row['do_supply_type'], 
                        row['fo_sg'], 
                        row['do_sg'], 
                        row['total_fo_cons_in_mt'], 
                        row['total_do_cons_in_mt'], 
                        row['fo_rob_in_mt'], 
                        row['do_rob_in_mt'],
                        voyagereport_id  # Foreign key to voyagereport
                    )

                    # Insert into ifs_voyagedataengine
                    cursor.execute("""
                        INSERT INTO ifs_voyagedataengine 
                        (
                            engine_merpm, 
                            engine_meload, 
                            engine_proprpm, 
                            engine_speed, 
                            engine_propcpp, 
                            me_fm_in, 
                            me_fm_out, 
                            me_fo_cons, 
                            me_do_cons, 
                            me_cons_check, 
                            me_rh, 
                            boiler_fm_in, 
                            boiler_fm_out, 
                            boiler_fo_cons, 
                            boiler_do_cons, 
                            boiler_cons_check, 
                            boiler_rh, 
                            aux_fm, 
                            aux1_do_cons, 
                            aux2_do_cons, 
                            aux3_do_cons, 
                            aux_cons_check, 
                            aux1_rh, 
                            aux2_rh, 
                            aux3_rh, 
                            cc1_do_cons, 
                            cc2_do_cons, 
                            cc3_do_cons, 
                            cc4_do_cons, 
                            cc5_do_cons, 
                            cc6_do_cons, 
                            cc1_rh, 
                            cc2_rh, 
                            cc3_rh, 
                            cc4_rh, 
                            cc5_rh, 
                            cc6_rh, 
                            eg_do_cons, 
                            eg_rh, 
                            bt_do_cons, 
                            bt_rh, 
                            other_fo_cons, 
                            other_do_cons, 
                            total_fo_cons_in_kl, 
                            total_do_cons_in_kl, 
                            fo_rob_in_kl, 
                            fo_fots, 
                            fo_correction, 
                            fo_supply, 
                            fo_supply_type, 
                            do_rob_in_kl, 
                            do_fots, 
                            do_correction, 
                            do_supply, 
                            do_supply_type, 
                            fo_sg, 
                            do_sg, 
                            total_fo_cons_in_mt, 
                            total_do_cons_in_mt, 
                            fo_rob_in_mt, 
                            do_rob_in_mt,
                            voyagereport_id
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s
                        )
                    """, dataengine_values)

                connection.commit()
                print("New voyage data inserted successfully.")
    except Exception as e:
        print(f"Error inserting data into the database: {e}")


def process_new_file(new_file):
    file_path = os.path.join(folder_path, new_file)
    try:
        vessel_id = extract_vessel_id_from_excel(file_path)
        voyage_number = extract_voyage_number_from_excel(file_path)
        parse_voyage_excel_to_db(file_path, vessel_id, voyage_number)
    except Exception as e:
        print(f"Error processing file {new_file}: {e}")

def extract_vessel_id_from_excel(filepath):
    df = pd.read_excel(filepath, sheet_name="Form_Engine", header=None, usecols="C", nrows=4)
    vessel_id = df.iloc[2, 0]
    print(f"Extracted Vessel ID: {vessel_id}")
    return vessel_id

def extract_voyage_number_from_excel(filepath):
    df = pd.read_excel(filepath, sheet_name="Form_Engine", header=None, usecols="C", nrows=5)
    voyage_number = df.iloc[3, 0]
    print(f"Extracted Voyage Number: {voyage_number}")
    return voyage_number

# ===== Main Loop =====
if __name__ == "__main__":
    print("Monitoring started...")
    try:
        while True:
            current_files = set(os.listdir(folder_path))
            new_files = current_files - processed_files

            for new_file in new_files:
                if new_file.endswith(".xlsx"):  # Only process Excel files
                    process_new_file(new_file)
                    processed_files.add(new_file)  # Mark as processed

            time_module.sleep(10)  # Check every 10 seconds

    except KeyboardInterrupt:
        print("Monitoring stopped by user.")
   
