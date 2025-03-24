import os
import time
import pandas as pd
import pymysql
import numpy as np
from sqlalchemy import create_engine
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

# Folder to monitor
folder_path = r"C:\Users\Reza\Documents\Sea Trial"

# Track processed files
processed_files = set(os.listdir(folder_path))

# MySQL connection settings
db_url = "mysql+pymysql://root:admin123@127.0.0.1:3306/fleetsys"
engine = create_engine(db_url)

# Parameter mappings (for lookup)
PARAMETER_MAP = {
    "Ship Speed": "010005",
    "M/E Power": "020107",
    "FOC": "020103"
}

def calculate_quadratic_regression(vessel_id, session_id, parameter_y_code, model_type):
    """
    Perform quadratic regression and store model coefficients in SeaTrialModels.
    Independent variable (X): M/E Power (code '020107')
    Dependent variable (Y): provided by parameter_y_code.
    model_type is a string ("internal" or "external").
    """
    connection = pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="admin123",
        database="fleetsys",
        cursorclass=pymysql.cursors.DictCursor
    )
    try:
        with connection.cursor() as cursor:
            # Fetch data: Y vs. X for the given vessel and session
            cursor.execute("""
                SELECT sp.value AS y_value, sx.value AS x_value
                FROM enr_seatrialparameter sp
                JOIN enr_seatrialparameter sx 
                  ON sp.vessel_id = sx.vessel_id AND sp.session_id = sx.session_id AND sp.timestamp = sx.timestamp
                WHERE sp.vessel_id = %s AND sp.session_id = %s
                  AND sp.parameter_id = (SELECT id FROM enr_parameterlist WHERE code = %s)
                  AND sx.parameter_id = (SELECT id FROM enr_parameterlist WHERE code = '020107')
            """, (vessel_id, session_id, parameter_y_code))
            data = cursor.fetchall()

            if not data:
                print(f"⚠️ No data found for regression (Vessel: {vessel_id}, Session ID: {session_id}, Dependent: {parameter_y_code})")
                return

            # Prepare data for quadratic regression
            x_values = np.array([row['x_value'] for row in data]).reshape(-1, 1)
            y_values = np.array([row['y_value'] for row in data])

            poly = PolynomialFeatures(degree=2)
            x_poly = poly.fit_transform(x_values)

            reg = LinearRegression()
            reg.fit(x_poly, y_values)

            # For quadratic regression:
            # a = coefficient for x^2, b = coefficient for x, c = intercept
            a = reg.coef_[2]
            b = reg.coef_[1]
            c = reg.intercept_
            r_squared = reg.score(x_poly, y_values)

            # Insert or update the SeaTrialModels record with the calculated regression
            cursor.execute("""
                INSERT INTO enr_seatrialmodels 
                  (vessel_id, session_id, formula_type, model_type, parameter_x_id, parameter_y_id, 
                   coefficient_a, coefficient_b, coefficient_c, coefficient_determination, created_at)
                VALUES 
                  (%s, %s, 'quadratic', %s, 
                   (SELECT id FROM enr_parameterlist WHERE code = '020107'),
                   (SELECT id FROM enr_parameterlist WHERE code = %s),
                   %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE 
                    coefficient_a = VALUES(coefficient_a),
                    coefficient_b = VALUES(coefficient_b),
                    coefficient_c = VALUES(coefficient_c),
                    coefficient_determination = VALUES(coefficient_determination);
            """, (vessel_id, session_id, model_type, parameter_y_code, a, b, c, r_squared))
            connection.commit()
            print(f"✅ Quadratic regression model ({model_type}) stored for Vessel {vessel_id} - Session ID {session_id}")
    except Exception as e:
        print(f"❌ Error calculating regression: {e}")
    finally:
        connection.close()

def process_new_file(file_name):
    """Process a new Excel file and upsert data into MySQL."""
    file_path = os.path.join(folder_path, file_name)
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path, sheet_name="Sheet2", dtype={'Vessel': str})
        df = df.dropna(how='all')  # Drop completely empty rows
        df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce').ffill()
        session_start_date = df['Timestamp'].iloc[0]
        
        # Melt the DataFrame to get one row per parameter reading
        melted_df = df.melt(id_vars=['Vessel', 'Session', 'Timestamp', 'Displacement'], 
                             var_name='Parameter', 
                             value_name='Value')
        melted_df['Value'] = pd.to_numeric(melted_df['Value'], errors='coerce')
        melted_df = melted_df.dropna(subset=['Value'])
        
        connection = pymysql.connect(
            host="127.0.0.1",
            user="root",
            password="admin123",
            database="fleetsys",
            cursorclass=pymysql.cursors.Cursor
        )
        
        with connection.cursor() as cursor:
            # Process each row in the melted DataFrame
            for row in melted_df.itertuples(index=False):
                vessel_id = row.Vessel
                session_name = row.Session
                timestamp = row.Timestamp
                displacement = row.Displacement
                parameter = row.Parameter
                value = row.Value

                # Check if vessel exists
                cursor.execute("SELECT id FROM enr_vessellist WHERE id = %s", (vessel_id,))
                if not cursor.fetchone():
                    print(f"⚠️ Skipping row: Vessel {vessel_id} not found")
                    continue

                # Check or create session in SeaTrialSession table
                cursor.execute("SELECT id FROM enr_seatrialsession WHERE vessel_id = %s AND session_name = %s", 
                               (vessel_id, session_name))
                session_result = cursor.fetchone()
                if not session_result:
                    cursor.execute("""
                        INSERT INTO enr_seatrialsession (vessel_id, session_name, start_date, created_at) 
                        VALUES (%s, %s, %s, NOW())
                    """, (vessel_id, session_name, session_start_date))
                    connection.commit()
                    cursor.execute("SELECT id FROM enr_seatrialsession WHERE vessel_id = %s AND session_name = %s", 
                                   (vessel_id, session_name))
                    session_id = cursor.fetchone()[0]
                else:
                    session_id = session_result[0]

                # Get or insert parameter (using mapping if available)
                param_code = PARAMETER_MAP.get(parameter, parameter)
                cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (param_code,))
                param_result = cursor.fetchone()
                if not param_result:
                    cursor.execute("INSERT INTO enr_parameterlist (code, description, is_calculated) VALUES (%s, %s, %s)", 
                                   (param_code, f"Description for {param_code}", 0))
                    connection.commit()
                    cursor.execute("SELECT id FROM enr_parameterlist WHERE code = %s", (param_code,))
                    parameter_id = cursor.fetchone()[0]
                else:
                    parameter_id = param_result[0]
                
                # Insert into SeaTrialParameter table using the session_id
                cursor.execute("""
                    INSERT INTO enr_seatrialparameter (vessel_id, session_id, timestamp, displacement, parameter_id, value)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        displacement = VALUES(displacement),
                        value = VALUES(value);
                """, (vessel_id, session_id, timestamp, displacement, parameter_id, value))
            connection.commit()
        connection.close()
        print(f"✅ Data imported from {file_name}")
        
        # Perform quadratic regression for both models:
        # a) Internal model: parameter_y = FOC ("020103")
        calculate_quadratic_regression(vessel_id, session_id, '020103', 'internal')
        print(f"Done1")
        # b) External model: parameter_y = Ship Speed ("010005")
        calculate_quadratic_regression(vessel_id, session_id, '010005', 'external')
        print(f"Done2")
        
    except Exception as e:
        print(f"❌ Error processing {file_name}: {e}")

# Main loop: Check for new files every 10 seconds
while True:
    current_files = set(os.listdir(folder_path))
    new_files = current_files - processed_files  # Detect new files
    for new_file in new_files:
        if new_file.endswith(".xlsx"):  # Only process Excel files
            process_new_file(new_file)
            processed_files.add(new_file)  # Mark as processed
    time.sleep(10)  # Check every 10 seconds
