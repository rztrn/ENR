import os
import time
import pandas as pd
import pymysql
from sqlalchemy import create_engine

# Folder to monitor
folder_path = r"C:\Users\Reza\Documents\ENR"

# Track already processed fil es
processed_files = set(os.listdir(folder_path))

# MySQL connection settings
db_url = "mysql+pymysql://root:admin123@127.0.0.1:3306/fleetsys"
engine = create_engine(db_url)

def process_new_file(file_name):
    """Process a new Excel file and upsert data into MySQL."""
    file_path = os.path.join(folder_path, file_name)
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path, sheet_name="Sheet3", dtype={'Vessel': str})

        # Drop completely empty rows
        df = df.dropna(how='all')

        # Convert "Date" column to datetime format (force errors to NaT)
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')

        # Fill NaT values in the "Date" column with the previous row's date
        df['Date'] = df['Date'].ffill()

        # Melt the DataFrame to transform it into the desired format
        melted_df = df.melt(id_vars=['Vessel', 'Date', 'Movement', 'Displacement'], 
                             var_name='Parameter', 
                             value_name='Value')

        # Convert "Value" column to numeric, setting non-numeric values to NaN
        melted_df['Value'] = pd.to_numeric(melted_df['Value'], errors='coerce')

        # Log rows where Value was originally a string (optional, for debugging)
        invalid_values = melted_df[melted_df['Value'].isna()]
        if not invalid_values.empty:
            print(f"⚠️ Skipped {len(invalid_values)} rows due to non-numeric 'Value':")
            print(invalid_values[['Vessel', 'Date', 'Parameter', 'Value']].head(5))  # Show first 5 invalid rows

        # Drop rows where Value is still NaN after conversion
        melted_df = melted_df.dropna(subset=['Value'])

        # Convert DataFrame to list of tuples for SQL execution
        data_tuples = [tuple(row) for row in melted_df.itertuples(index=False, name=None)]

        # Define the SQL query with ON DUPLICATE KEY UPDATE
        sql = """
        INSERT INTO enr_enrparameter (vessel, date, movement, displacement, parameter, value)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            movement = VALUES(movement),
            displacement = VALUES(displacement),
            value = VALUES(value);
        """

        # Connect to MySQL using pymysql directly
        connection = pymysql.connect(
            host="127.0.0.1",
            user="root",
            password="admin123",
            database="fleetsys",
            cursorclass=pymysql.cursors.Cursor
        )

        with connection.cursor() as cursor:
            cursor.executemany(sql, data_tuples)
        
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
