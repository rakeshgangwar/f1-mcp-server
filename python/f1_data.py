#!/usr/bin/env python3
"""
FastF1 MCP Server - Python Bridge
This script provides functions to access Formula 1 data using the FastF1 library.
It is designed to be called from the Node.js MCP server.
"""

import sys
import json
import traceback
import fastf1
import pandas as pd
import numpy as np
from datetime import datetime

# Configure FastF1 cache
fastf1.Cache.enable_cache('~/Documents/Cline/MCP/f1-mcp-server/cache')

def json_serial(obj):
    """Helper function to convert non-JSON serializable objects to strings"""
    if isinstance(obj, (datetime, pd.Timestamp)):
        return obj.isoformat()
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj) if isinstance(obj, np.floating) else int(obj)
    if pd.isna(obj):
        return None
    return str(obj)

def get_event_schedule(year):
    """Get the event schedule for a specified season"""
    try:
        year = int(year)
        schedule = fastf1.get_event_schedule(year)
        
        # Convert DataFrame to JSON serializable format
        result = []
        for _, row in schedule.iterrows():
            event_dict = row.to_dict()
            # Clean and convert non-serializable values
            clean_dict = {k: json_serial(v) for k, v in event_dict.items()}
            result.append(clean_dict)
        
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def get_event_info(year, identifier):
    """Get information about a specific event"""
    try:
        year = int(year)
        # Identifier can be event name or round number
        if identifier.isdigit():
            event = fastf1.get_event(year, int(identifier))
        else:
            event = fastf1.get_event(year, identifier)
        
        # Convert Series to dict and clean non-serializable values
        event_dict = event.to_dict()
        clean_dict = {k: json_serial(v) for k, v in event_dict.items()}
        
        return {"status": "success", "data": clean_dict}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def get_session_results(year, event_identifier, session_name):
    """Get results for a specific session"""
    try:
        year = int(year)
        session = fastf1.get_session(year, event_identifier, session_name)
        session.load(telemetry=False)  # Load session without telemetry for faster results
        
        # Get results as a DataFrame
        results = session.results
        
        # Convert results to JSON serializable format
        result_list = []
        for driver_num, result in results.items():
            driver_result = result.to_dict()
            # Clean and convert non-serializable values
            clean_dict = {k: json_serial(v) for k, v in driver_result.items()}
            result_list.append(clean_dict)
        
        return {"status": "success", "data": result_list}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def get_driver_info(year, event_identifier, session_name, driver_identifier):
    """Get information about a specific driver"""
    try:
        year = int(year)
        session = fastf1.get_session(year, event_identifier, session_name)
        session.load(telemetry=False)  # Load session without telemetry for faster results
        
        driver_info = session.get_driver(driver_identifier)
        
        # Convert to JSON serializable format
        driver_dict = driver_info.to_dict()
        clean_dict = {k: json_serial(v) for k, v in driver_dict.items()}
        
        return {"status": "success", "data": clean_dict}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def analyze_driver_performance(year, event_identifier, session_name, driver_identifier):
    """Analyze a driver's performance in a session"""
    try:
        year = int(year)
        session = fastf1.get_session(year, event_identifier, session_name)
        session.load()
        
        # Get laps for the specified driver
        driver_laps = session.laps.pick_driver(driver_identifier)
        
        # Basic statistics
        fastest_lap = driver_laps.pick_fastest()
        
        # Calculate average lap time (excluding outliers)
        valid_lap_times = []
        for _, lap in driver_laps.iterrows():
            if lap['LapTime'] is not None and not pd.isna(lap['LapTime']):
                valid_lap_times.append(lap['LapTime'].total_seconds())
        
        avg_lap_time = sum(valid_lap_times) / len(valid_lap_times) if valid_lap_times else None
        
        # Format lap time as minutes:seconds.milliseconds
        formatted_fastest = str(fastest_lap['LapTime']) if not pd.isna(fastest_lap['LapTime']) else None
        
        # Get all lap times
        lap_times = []
        for _, lap in driver_laps.iterrows():
            lap_dict = {
                "LapNumber": int(lap['LapNumber']) if not pd.isna(lap['LapNumber']) else None,
                "LapTime": str(lap['LapTime']) if not pd.isna(lap['LapTime']) else None,
                "Compound": lap['Compound'] if not pd.isna(lap['Compound']) else None,
                "TyreLife": int(lap['TyreLife']) if not pd.isna(lap['TyreLife']) else None,
                "Stint": int(lap['Stint']) if not pd.isna(lap['Stint']) else None,
                "FreshTyre": bool(lap['FreshTyre']) if not pd.isna(lap['FreshTyre']) else None,
                "LapStartTime": json_serial(lap['LapStartTime']) if not pd.isna(lap['LapStartTime']) else None
            }
            lap_times.append(lap_dict)
        
        # Format results
        result = {
            "DriverCode": fastest_lap['Driver'] if not pd.isna(fastest_lap['Driver']) else None,
            "TotalLaps": len(driver_laps),
            "FastestLap": formatted_fastest,
            "AverageLapTime": avg_lap_time,
            "LapTimes": lap_times
        }
        
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def compare_drivers(year, event_identifier, session_name, drivers):
    """Compare performance between multiple drivers"""
    try:
        year = int(year)
        drivers_list = drivers.split(",")
        
        session = fastf1.get_session(year, event_identifier, session_name)
        session.load()
        
        driver_comparisons = []
        
        for driver in drivers_list:
            # Get laps and fastest lap for each driver
            driver_laps = session.laps.pick_driver(driver)
            fastest_lap = driver_laps.pick_fastest()
            
            # Calculate average lap time
            valid_lap_times = []
            for _, lap in driver_laps.iterrows():
                if lap['LapTime'] is not None and not pd.isna(lap['LapTime']):
                    valid_lap_times.append(lap['LapTime'].total_seconds())
            
            avg_lap_time = sum(valid_lap_times) / len(valid_lap_times) if valid_lap_times else None
            
            # Format lap time as string
            formatted_fastest = str(fastest_lap['LapTime']) if not pd.isna(fastest_lap['LapTime']) else None
            
            # Compile driver data
            driver_data = {
                "DriverCode": driver,
                "FastestLap": formatted_fastest,
                "FastestLapNumber": int(fastest_lap['LapNumber']) if not pd.isna(fastest_lap['LapNumber']) else None,
                "TotalLaps": len(driver_laps),
                "AverageLapTime": avg_lap_time
            }
            
            driver_comparisons.append(driver_data)
        
        return {"status": "success", "data": driver_comparisons}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def get_telemetry(year, event_identifier, session_name, driver_identifier, lap_number=None):
    """Get telemetry data for a specific lap or fastest lap"""
    try:
        year = int(year)
        session = fastf1.get_session(year, event_identifier, session_name)
        session.load()
        
        # Get laps for the specified driver
        driver_laps = session.laps.pick_driver(driver_identifier)
        
        # Get the specific lap or fastest lap
        if lap_number:
            lap = driver_laps[driver_laps['LapNumber'] == int(lap_number)].iloc[0]
        else:
            lap = driver_laps.pick_fastest()
        
        # Get telemetry data
        telemetry = lap.get_telemetry()
        
        # Convert to JSON serializable format
        telemetry_dict = telemetry.to_dict(orient='records')
        clean_data = []
        
        for item in telemetry_dict:
            clean_item = {k: json_serial(v) for k, v in item.items()}
            clean_data.append(clean_item)
        
        # Add lap information
        lap_info = {
            "LapNumber": int(lap['LapNumber']) if not pd.isna(lap['LapNumber']) else None,
            "LapTime": str(lap['LapTime']) if not pd.isna(lap['LapTime']) else None,
            "Compound": lap['Compound'] if not pd.isna(lap['Compound']) else None,
            "TyreLife": int(lap['TyreLife']) if not pd.isna(lap['TyreLife']) else None
        }
        
        result = {
            "lapInfo": lap_info,
            "telemetry": clean_data
        }
        
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def get_championship_standings(year, round_num=None):
    """Get championship standings for drivers and constructors"""
    try:
        year = int(year)
        
        # Create Ergast API client
        ergast = fastf1.ergast.Ergast()
        
        # Get Ergast API data
        if round_num:
            drivers_standings = ergast.get_driver_standings(season=year, round=round_num).content[0]
            constructor_standings = ergast.get_constructor_standings(season=year, round=round_num).content[0]
        else:
            drivers_standings = ergast.get_driver_standings(season=year).content[0]
            constructor_standings = ergast.get_constructor_standings(season=year).content[0]
        
        # Convert driver standings to JSON serializable format
        drivers_list = []
        for _, row in drivers_standings.iterrows():
            driver_dict = row.to_dict()
            clean_dict = {k: json_serial(v) for k, v in driver_dict.items()}
            drivers_list.append(clean_dict)
        
        # Convert constructor standings to JSON serializable format
        constructors_list = []
        for _, row in constructor_standings.iterrows():
            constructor_dict = row.to_dict()
            clean_dict = {k: json_serial(v) for k, v in constructor_dict.items()}
            constructors_list.append(clean_dict)
        
        return {
            "status": "success",
            "data": {
                "drivers": drivers_list,
                "constructors": constructors_list
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

def main():
    """Main function to parse arguments and call appropriate function"""
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No function specified"}))
        return
    
    function_name = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    functions = {
        "get_event_schedule": get_event_schedule,
        "get_event_info": get_event_info,
        "get_session_results": get_session_results,
        "get_driver_info": get_driver_info,
        "analyze_driver_performance": analyze_driver_performance,
        "compare_drivers": compare_drivers,
        "get_telemetry": get_telemetry,
        "get_championship_standings": get_championship_standings
    }
    
    if function_name in functions:
        result = functions[function_name](*args)
        print(json.dumps(result))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown function: {function_name}"}))

if __name__ == "__main__":
    main()
