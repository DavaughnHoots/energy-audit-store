#!/usr/bin/env python3
"""
Weather Data Preprocessor for Energy Audit System

This script processes the large WeatherEvents dataset and extracts energy-relevant
data for integration with the Energy Audit system. It creates location-specific 
weather profiles that can enhance HVAC efficiency calculations, energy consumption 
analysis, and financial calculations.

Usage:
  python preprocess_weather_data.py --input WeatherEvents_Jan2016-Dec2022.csv --output-dir processed_weather_data
"""

import pandas as pd
import numpy as np
import os
import json
import time
import argparse
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import sys
from typing import Dict, List, Tuple, Set, Optional, Any, Union

# Constants for energy calculations
BASE_TEMP_HEATING = 65.0  # °F - standard base for heating degree days
BASE_TEMP_COOLING = 65.0  # °F - standard base for cooling degree days
SEVERE_WEATHER_TYPES = {'Cold', 'Snow', 'Thunderstorm', 'Hail', 'Hurricane', 'Tornado', 'Heat'}

def extract_temperature(severity: str, event_type: str) -> Optional[float]:
    """
    Extract temperature data from event information.
    
    Some weather events contain temperature data in their description.
    
    Args:
        severity: The severity description which might contain temperature
        event_type: The type of weather event
        
    Returns:
        Estimated temperature in Fahrenheit or None if not available
    """
    if event_type == 'Cold':
        # Estimate based on severity
        if severity == 'Extreme':
            return 10.0
        elif severity == 'Severe':
            return 20.0
        elif severity == 'Moderate':
            return 30.0
        else:  # Light
            return 40.0
    elif event_type == 'Heat':
        # Estimate based on severity
        if severity == 'Extreme':
            return 105.0
        elif severity == 'Severe':
            return 100.0
        elif severity == 'Moderate':
            return 95.0
        else:  # Light
            return 90.0
    
    # For other event types, no temperature can be directly inferred
    return None

def calculate_event_impact_score(event_type: str, severity: str, duration_hours: float) -> float:
    """
    Calculate impact score for an event based on its type, severity, and duration.
    
    This provides an energy-relevant impact measure for weather events.
    
    Args:
        event_type: Type of the weather event
        severity: Severity level
        duration_hours: Duration in hours
        
    Returns:
        Impact score ranging from 0 (no impact) to 10 (extreme impact)
    """
    # Base impact by event type (0-10 scale)
    base_impacts = {
        'Cold': 9.0,
        'Heat': 8.5,
        'Snow': 7.0,
        'Thunderstorm': 6.0,
        'Rain': 4.0,
        'Fog': 2.0,
        'Hail': 5.0,
        'Wind': 3.0,
        'Hurricane': 10.0,
        'Tornado': 10.0,
        'Precipitation': 3.5,
        'Cloudy': 1.0
    }
    
    # Default impact for unlisted event types
    base_impact = base_impacts.get(event_type, 1.0)
    
    # Severity multiplier
    severity_multipliers = {
        'Extreme': 1.0,
        'Severe': 0.8,
        'Moderate': 0.6,
        'Light': 0.3,
        'Heavy': 0.9,
        'UNK': 0.5  # Unknown severity
    }
    
    severity_multiplier = severity_multipliers.get(severity, 0.5)
    
    # Duration factor (capped at 24 hours for relevance)
    duration_factor = min(duration_hours, 24) / 24.0
    
    # Calculate final score, normalize to 0-10
    impact_score = base_impact * severity_multiplier * (0.5 + 0.5 * duration_factor)
    return min(10.0, impact_score)

def preprocess_weather_data(
    input_file: str, 
    output_dir: str, 
    chunk_size: int = 100000,
    state_filter: Optional[Set[str]] = None,
    max_chunks: Optional[int] = None
) -> Dict[str, Any]:
    """
    Process large weather data file and extract energy-relevant data.
    
    Args:
        input_file: Path to the input CSV file
        output_dir: Directory to save processed outputs
        chunk_size: Number of rows to process at once
        state_filter: Set of state codes to filter by (e.g. {'NY', 'CA'})
        max_chunks: Maximum number of chunks to process (for testing)
        
    Returns:
        Dictionary with processing statistics
    """
    start_time = time.time()
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # First check file size to warn about processing time
    file_size_gb = os.path.getsize(input_file) / (1024 ** 3)
    print(f"File size: {file_size_gb:.2f} GB")
    
    # Read the first few rows to get column structure
    print("Reading file header and sample rows...")
    try:
        sample_df = pd.read_csv(input_file, nrows=5)
        print("\nColumn structure:")
        print(sample_df.columns.tolist())
        print("\nData sample:")
        print(sample_df.head())
    except Exception as e:
        print(f"Error reading CSV header: {str(e)}")
        return {'error': str(e)}
    
    # Determine required columns from the header
    required_columns = ['EventId', 'Type', 'Severity', 'StartTime(UTC)', 'EndTime(UTC)', 
                        'Precipitation(in)', 'TimeZone', 'LocationLat', 'LocationLng', 
                        'City', 'County', 'State', 'ZipCode']
    
    # Verify all required columns exist
    missing_columns = [col for col in required_columns if col not in sample_df.columns]
    if missing_columns:
        print(f"Error: Missing required columns: {missing_columns}")
        return {'error': f"Missing required columns: {missing_columns}"}
    
    # Initialize SQLite database for processed data
    db_path = os.path.join(output_dir, "weather_energy_data.db")
    conn = sqlite3.connect(db_path)
    
    # Create tables
    create_tables(conn)
    
    # Initialize data structures for preprocessing
    location_data = {}  # Store location details
    daily_weather = {}  # Aggregate daily weather stats
    monthly_stats = {}  # Aggregate monthly statistics
    event_stats = {}   # Event type statistics
    
    # Process file in chunks
    chunks_processed = 0
    total_rows = 0
    total_events_processed = 0
    filtered_rows = 0
    
    print("\nProcessing file in chunks...")
    for chunk in pd.read_csv(input_file, chunksize=chunk_size):
        chunks_processed += 1
        
        # Apply state filter if provided
        if state_filter:
            original_len = len(chunk)
            chunk = chunk[chunk['State'].isin(state_filter)]
            filtered_rows += (original_len - len(chunk))
        
        chunk_rows = len(chunk)
        total_rows += chunk_rows
        
        if chunks_processed % 5 == 0:
            elapsed = time.time() - start_time
            print(f"Processed {chunks_processed} chunks ({total_rows:,} rows) in {elapsed:.2f} seconds...")
        
        # Process the chunk
        process_chunk(chunk, conn, location_data, daily_weather, monthly_stats, event_stats)
        
        total_events_processed += chunk_rows
        
        # Break if we've reached max_chunks (for testing)
        if max_chunks and chunks_processed >= max_chunks:
            print(f"Reached maximum chunk limit ({max_chunks}). Stopping.")
            break
    
    # Save aggregated data
    print("Saving processed data...")
    
    # Finalize daily weather data
    save_daily_weather_data(daily_weather, conn)
    
    # Finalize and save location data
    save_location_data(location_data, output_dir, conn)
    
    # Save monthly statistics
    save_monthly_statistics(monthly_stats, output_dir, conn)
    
    # Save event statistics
    save_event_statistics(event_stats, output_dir, conn)
    
    # Generate degree day data
    generate_degree_day_data(daily_weather, monthly_stats, output_dir, conn)
    
    # Create efficient indexes
    create_indexes(conn)
    
    # Commit changes and close database
    conn.commit()
    conn.close()
    
    elapsed_time = time.time() - start_time
    
    # Generate execution summary
    summary = {
        'file_size_gb': file_size_gb,
        'total_rows': total_rows,
        'chunks_processed': chunks_processed,
        'filtered_rows': filtered_rows if state_filter else 0,
        'total_events_processed': total_events_processed,
        'locations_processed': len(location_data),
        'daily_records_created': sum(len(days) for days in daily_weather.values()),
        'elapsed_time_seconds': elapsed_time,
        'output_database': db_path
    }
    
    # Save summary to JSON
    summary_path = os.path.join(output_dir, "preprocessing_summary.json")
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nProcessing complete! Processed {total_rows:,} rows in {elapsed_time:.2f} seconds.")
    print(f"Processed {len(location_data):,} unique locations.")
    print(f"Output saved to {output_dir}")
    
    return summary

def create_tables(conn: sqlite3.Connection) -> None:
    """Create SQLite tables for processed data"""
    
    # Locations table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS locations (
        location_id TEXT PRIMARY KEY,
        zip_code TEXT,
        city TEXT,
        county TEXT,
        state TEXT,
        latitude REAL,
        longitude REAL,
        climate_zone INTEGER,
        event_frequency REAL
    )
    ''')
    
    # Daily weather table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS daily_weather (
        date TEXT,
        location_id TEXT,
        avg_temp REAL,
        min_temp REAL,
        max_temp REAL,
        precipitation REAL,
        heating_degree_days REAL,
        cooling_degree_days REAL,
        severe_events INTEGER,
        impact_score REAL,
        PRIMARY KEY (date, location_id),
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
    )
    ''')
    
    # Monthly statistics table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS monthly_stats (
        year INTEGER,
        month INTEGER,
        location_id TEXT,
        avg_temp REAL,
        total_heating_degree_days REAL,
        total_cooling_degree_days REAL,
        precipitation REAL,
        severe_event_days INTEGER,
        avg_impact_score REAL,
        PRIMARY KEY (year, month, location_id),
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
    )
    ''')
    
    # Event statistics table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS event_stats (
        location_id TEXT,
        event_type TEXT,
        count INTEGER,
        avg_duration REAL,
        avg_severity REAL,
        energy_impact_score REAL,
        PRIMARY KEY (location_id, event_type),
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
    )
    ''')

def process_chunk(
    chunk: pd.DataFrame, 
    conn: sqlite3.Connection,
    location_data: Dict[str, Dict[str, Any]],
    daily_weather: Dict[str, Dict[str, Dict[str, Any]]],
    monthly_stats: Dict[str, Dict[int, Dict[int, Dict[str, Any]]]],
    event_stats: Dict[str, Dict[str, Dict[str, Any]]]
) -> None:
    """
    Process a chunk of weather data
    
    Args:
        chunk: DataFrame chunk to process
        conn: SQLite connection
        location_data: Dictionary to store location information
        daily_weather: Dictionary to store daily weather data
        monthly_stats: Dictionary to store monthly statistics
        event_stats: Dictionary to store event statistics
    """
    # Clean data
    chunk = chunk.dropna(subset=['StartTime(UTC)', 'EndTime(UTC)', 'Type', 'Severity'])
    
    # Convert date columns to datetime
    chunk['StartTime(UTC)'] = pd.to_datetime(chunk['StartTime(UTC)'])
    chunk['EndTime(UTC)'] = pd.to_datetime(chunk['EndTime(UTC)'])
    
    # Extract duration in hours
    chunk['duration_hours'] = (chunk['EndTime(UTC)'] - chunk['StartTime(UTC)']) / pd.Timedelta(hours=1)
    
    # Process each event to extract energy-relevant information
    for _, event in chunk.iterrows():
        # Skip events with missing location data
        if pd.isna(event['ZipCode']) or pd.isna(event['State']):
            continue
        
        # Create location ID (zip+state for uniqueness in case of zip code duplication)
        location_id = f"{event['ZipCode']}_{event['State']}"
        
        # Extract date (use start time converted to local date)
        start_time_utc = event['StartTime(UTC)']
        
        # Get local date using timezone info if available, otherwise use UTC
        if not pd.isna(event['TimeZone']):
            # Convert to date in local timezone (simplification)
            # A complete implementation would use pytz for proper timezone handling
            local_date = start_time_utc.date().isoformat()
        else:
            local_date = start_time_utc.date().isoformat()
        
        # Extract year and month for monthly statistics
        year = start_time_utc.year
        month = start_time_utc.month
        
        # Process location data
        if location_id not in location_data:
            location_data[location_id] = {
                'zip_code': event['ZipCode'],
                'city': event['City'],
                'county': event['County'],
                'state': event['State'],
                'latitude': event['LocationLat'],
                'longitude': event['LocationLng'],
                'event_count': 0,
                'climate_zone': estimate_climate_zone(event['LocationLat'], event['LocationLng'])
            }
        
        location_data[location_id]['event_count'] += 1
        
        # Initialize daily weather data for this location if not exists
        if location_id not in daily_weather:
            daily_weather[location_id] = {}
        
        if local_date not in daily_weather[location_id]:
            daily_weather[location_id][local_date] = {
                'temp_values': [],
                'precipitation': 0.0,
                'severe_events': 0,
                'impact_scores': []
            }
        
        # Extract temperature if available from event type and severity
        temp = extract_temperature(event['Severity'], event['Type'])
        if temp is not None:
            daily_weather[location_id][local_date]['temp_values'].append(temp)
        
        # Extract precipitation
        if not pd.isna(event['Precipitation(in)']):
            daily_weather[location_id][local_date]['precipitation'] += event['Precipitation(in)']
        
        # Count severe weather events
        if event['Type'] in SEVERE_WEATHER_TYPES:
            daily_weather[location_id][local_date]['severe_events'] += 1
        
        # Calculate impact score
        impact_score = calculate_event_impact_score(
            event['Type'], 
            event['Severity'], 
            event['duration_hours']
        )
        daily_weather[location_id][local_date]['impact_scores'].append(impact_score)
        
        # Update monthly statistics
        if location_id not in monthly_stats:
            monthly_stats[location_id] = {}
        
        if year not in monthly_stats[location_id]:
            monthly_stats[location_id][year] = {}
        
        if month not in monthly_stats[location_id][year]:
            monthly_stats[location_id][year][month] = {
                'temp_values': [],
                'precipitation': 0.0,
                'severe_event_days': set(),
                'impact_scores': []
            }
        
        # Add temperature to monthly stats if available
        if temp is not None:
            monthly_stats[location_id][year][month]['temp_values'].append(temp)
        
        # Add precipitation to monthly stats
        if not pd.isna(event['Precipitation(in)']):
            monthly_stats[location_id][year][month]['precipitation'] += event['Precipitation(in)']
        
        # Add day to severe event days set if applicable
        if event['Type'] in SEVERE_WEATHER_TYPES:
            monthly_stats[location_id][year][month]['severe_event_days'].add(local_date)
        
        # Add impact score to monthly stats
        monthly_stats[location_id][year][month]['impact_scores'].append(impact_score)
        
        # Update event statistics
        if location_id not in event_stats:
            event_stats[location_id] = {}
        
        if event['Type'] not in event_stats[location_id]:
            event_stats[location_id][event['Type']] = {
                'count': 0,
                'duration_total': 0.0,
                'severity_values': [],
                'impact_scores': []
            }
        
        event_stats[location_id][event['Type']]['count'] += 1
        event_stats[location_id][event['Type']]['duration_total'] += event['duration_hours']
        
        # Map severity to numeric value
        severity_map = {
            'Extreme': 4.0,
            'Severe': 3.0,
            'Moderate': 2.0,
            'Light': 1.0,
            'Heavy': 3.5,
            'UNK': 2.0
        }
        severity_value = severity_map.get(event['Severity'], 2.0)
        event_stats[location_id][event['Type']]['severity_values'].append(severity_value)
        event_stats[location_id][event['Type']]['impact_scores'].append(impact_score)

def estimate_climate_zone(latitude: float, longitude: float) -> int:
    """
    Estimate climate zone based on latitude and longitude
    Using simplified climate zones (1-5) based on latitude
    """
    # Very simple estimation for US climate zones
    abs_lat = abs(latitude)
    
    if abs_lat < 27:  # Hot/tropical
        return 1
    elif abs_lat < 34:  # Hot/warm
        return 2
    elif abs_lat < 40:  # Mixed/moderate
        return 3
    elif abs_lat < 45:  # Mixed/cold
        return 4
    else:  # Cold
        return 5

def save_daily_weather_data(
    daily_weather: Dict[str, Dict[str, Dict[str, Any]]],
    conn: sqlite3.Connection
) -> None:
    """
    Process daily weather data and save to database
    
    Args:
        daily_weather: Dictionary with daily weather data by location and date
        conn: SQLite connection
    """
    print("Saving daily weather data...")
    
    data_to_insert = []
    
    for location_id, dates in daily_weather.items():
        for date, data in dates.items():
            # Calculate temperature statistics
            if data['temp_values']:
                avg_temp = sum(data['temp_values']) / len(data['temp_values'])
                min_temp = min(data['temp_values'])
                max_temp = max(data['temp_values'])
                
                # Calculate degree days
                hdd = max(0, BASE_TEMP_HEATING - avg_temp) if avg_temp is not None else 0
                cdd = max(0, avg_temp - BASE_TEMP_COOLING) if avg_temp is not None else 0
            else:
                # No temperature data available
                avg_temp = None
                min_temp = None
                max_temp = None
                hdd = 0
                cdd = 0
            
            # Calculate average impact score
            if data['impact_scores']:
                avg_impact = sum(data['impact_scores']) / len(data['impact_scores'])
            else:
                avg_impact = 0
            
            # Prepare data for insertion
            data_to_insert.append((
                date,
                location_id,
                avg_temp,
                min_temp,
                max_temp,
                data['precipitation'],
                hdd,
                cdd,
                data['severe_events'],
                avg_impact
            ))
    
    # Insert data in batches
    batch_size = 1000
    for i in range(0, len(data_to_insert), batch_size):
        batch = data_to_insert[i:i+batch_size]
        conn.executemany('''
            INSERT OR REPLACE INTO daily_weather
            (date, location_id, avg_temp, min_temp, max_temp, precipitation, 
             heating_degree_days, cooling_degree_days, severe_events, impact_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', batch)

def save_location_data(
    location_data: Dict[str, Dict[str, Any]],
    output_dir: str,
    conn: sqlite3.Connection
) -> None:
    """
    Process location data and save to database and JSON
    
    Args:
        location_data: Dictionary with location data
        output_dir: Output directory
        conn: SQLite connection
    """
    print("Saving location data...")
    
    data_to_insert = []
    
    for location_id, data in location_data.items():
        # Calculate event frequency (events per year)
        # Assuming data spans roughly 7 years (2016-2022)
        event_frequency = data['event_count'] / 7.0
        
        # Prepare data for insertion
        data_to_insert.append((
            location_id,
            data['zip_code'],
            data['city'],
            data['county'],
            data['state'],
            data['latitude'],
            data['longitude'],
            data['climate_zone'],
            event_frequency
        ))
    
    # Insert data in batches
    batch_size = 1000
    for i in range(0, len(data_to_insert), batch_size):
        batch = data_to_insert[i:i+batch_size]
        conn.executemany('''
            INSERT OR REPLACE INTO locations
            (location_id, zip_code, city, county, state, latitude, longitude, 
             climate_zone, event_frequency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', batch)
    
    # Save locations to JSON for easy lookup
    locations_by_state = {}
    for location_id, data in location_data.items():
        state = data['state']
        if state not in locations_by_state:
            locations_by_state[state] = []
        
        locations_by_state[state].append({
            'location_id': location_id,
            'zip_code': data['zip_code'],
            'city': data['city'],
            'county': data['county'],
            'latitude': float(data['latitude']),
            'longitude': float(data['longitude']),
            'climate_zone': data['climate_zone']
        })
    
    # Save JSON by state
    for state, locations in locations_by_state.items():
        state_dir = os.path.join(output_dir, 'locations_by_state')
        os.makedirs(state_dir, exist_ok=True)
        
        filename = os.path.join(state_dir, f"{state}.json")
        with open(filename, 'w') as f:
            json.dump(locations, f, indent=2)

def save_monthly_statistics(
    monthly_stats: Dict[str, Dict[int, Dict[int, Dict[str, Any]]]],
    output_dir: str,
    conn: sqlite3.Connection
) -> None:
    """
    Process monthly statistics and save to database
    
    Args:
        monthly_stats: Dictionary with monthly statistics by location, year, and month
        output_dir: Output directory
        conn: SQLite connection
    """
    print("Saving monthly statistics...")
    
    data_to_insert = []
    
    # Calculate monthly statistics for each location, year, and month
    for location_id, years in monthly_stats.items():
        for year, months in years.items():
            for month, data in months.items():
                # Calculate average temperature
                if data['temp_values']:
                    avg_temp = sum(data['temp_values']) / len(data['temp_values'])
                else:
                    avg_temp = None
                
                # Calculate average impact score
                if data['impact_scores']:
                    avg_impact = sum(data['impact_scores']) / len(data['impact_scores'])
                else:
                    avg_impact = 0
                
                # Calculate degree days
                if avg_temp is not None:
                    # Approximate days in month
                    days_in_month = 30
                    total_hdd = max(0, BASE_TEMP_HEATING - avg_temp) * days_in_month
                    total_cdd = max(0, avg_temp - BASE_TEMP_COOLING) * days_in_month
                else:
                    total_hdd = 0
                    total_cdd = 0
                
                # Count severe event days
                severe_event_days = len(data['severe_event_days'])
                
                # Prepare data for insertion
                data_to_insert.append((
                    year,
                    month,
                    location_id,
                    avg_temp,
                    total_hdd,
                    total_cdd,
                    data['precipitation'],
                    severe_event_days,
                    avg_impact
                ))
    
    # Insert data in batches
    batch_size = 1000
    for i in range(0, len(data_to_insert), batch_size):
        batch = data_to_insert[i:i+batch_size]
        conn.executemany('''
            INSERT OR REPLACE INTO monthly_stats
            (year, month, location_id, avg_temp, total_heating_degree_days, 
             total_cooling_degree_days, precipitation, severe_event_days, avg_impact_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', batch)

def save_event_statistics(
    event_stats: Dict[str, Dict[str, Dict[str, Any]]],
    output_dir: str,
    conn: sqlite3.Connection
) -> None:
    """
    Process event statistics and save to database
    
    Args:
        event_stats: Dictionary with event statistics by location and event type
        output_dir: Output directory
        conn: SQLite connection
    """
    print("Saving event statistics...")
    
    data_to_insert = []
    
    # Calculate event statistics for each location and event type
    for location_id, events in event_stats.items():
        for event_type, data in events.items():
            # Calculate average duration
            avg_duration = data['duration_total'] / data['count'] if data['count'] > 0 else 0
            
            # Calculate average severity
            if data['severity_values']:
                avg_severity = sum(data['severity_values']) / len(data['severity_values'])
            else:
                avg_severity = 0
            
            # Calculate energy impact score
            if data['impact_scores']:
                energy_impact = sum(data['impact_scores']) / len(data['impact_scores'])
            else:
                energy_impact = 0
            
            # Prepare data for insertion
            data_to_insert.append((
                location_id,
                event_type,
                data['count'],
                avg_duration,
                avg_severity,
                energy_impact
            ))
    
    # Insert data in batches
    batch_size = 1000
    for i in range(0, len(data_to_insert), batch_size):
        batch = data_to_insert[i:i+batch_size]
        conn.executemany('''
            INSERT OR REPLACE INTO event_stats
            (location_id, event_type, count, avg_duration, avg_severity, energy_impact_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', batch)

def generate_degree_day_data(
    daily_weather: Dict[str, Dict[str, Dict[str, Any]]],
    monthly_stats: Dict[str, Dict[int, Dict[int, Dict[str, Any]]]],
    output_dir: str,
    conn: sqlite3.Connection
) -> None:
    """
    Generate heating and cooling degree day data for energy consumption analysis
    
    Args:
        daily_weather: Dictionary with daily weather data
        monthly_stats: Dictionary with monthly statistics
        output_dir: Output directory
        conn: SQLite connection
    """
    print("Generating degree day data...")
    
    # Create directory for degree day data
    degree_day_dir = os.path.join(output_dir, 'degree_days')
    os.makedirs(degree_day_dir, exist_ok=True)
    
    # Extract location IDs and group by state
    location_states = {}
    locations_cursor = conn.execute("SELECT location_id, state FROM locations")
    for location_id, state in locations_cursor:
        if state not in location_states:
            location_states[state] = []
        location_states[state].append(location_id)
    
    # Process degree days by state
    for state, location_ids in location_states.items():
        state_degree_days = {
            'monthly': {
                'hdd': {},
                'cdd': {}
            }
        }
        
        # Calculate state averages from location data
        for location_id in location_ids:
            if location_id in monthly_stats:
                for year in monthly_stats[location_id]:
                    if year not in state_degree_days['monthly']['hdd']:
                        state_degree_days['monthly']['hdd'][year] = {}
                        state_degree_days['monthly']['cdd'][year] = {}
                    
                    for month in monthly_stats[location_id][year]:
                        if month not in state_degree_days['monthly']['hdd'][year]:
                            state_degree_days['monthly']['hdd'][year][month] = []
                            state_degree_days['monthly']['cdd'][year][month] = []
                        
                        # Calculate degree days from monthly temperature data
                        if month in monthly_stats[location_id][year]:
                            data = monthly_stats[location_id][year][month]
                            if data['temp_values']:
                                avg_temp = sum(data['temp_values']) / len(data['temp_values'])
                                
                                # Calculate heating degree days
                                if avg_temp < BASE_TEMP_HEATING:
                                    # Approximate days in month
                                    days_in_month = 30
                                    hdd = (BASE_TEMP_HEATING - avg_temp) * days_in_month
                                    state_degree_days['monthly']['hdd'][year][month].append(hdd)
                                
                                # Calculate cooling degree days
                                if avg_temp > BASE_TEMP_COOLING:
                                    # Approximate days in month
                                    days_in_month = 30
                                    cdd = (avg_temp - BASE_TEMP_COOLING) * days_in_month
                                    state_degree_days['monthly']['cdd'][year][month].append(cdd)
        
        # Calculate average degree days by month
        for year in state_degree_days['monthly']['hdd']:
            for month in state_degree_days['monthly']['hdd'][year]:
                if state_degree_days['monthly']['hdd'][year][month]:
                    state_degree_days['monthly']['hdd'][year][month] = sum(state_degree_days['monthly']['hdd'][year][month]) / len(state_degree_days['monthly']['hdd'][year][month])
                else:
                    state_degree_days['monthly']['hdd'][year][month] = 0
                
                if state_degree_days['monthly']['cdd'][year][month]:
                    state_degree_days['monthly']['cdd'][year][month] = sum(state_degree_days['monthly']['cdd'][year][month]) / len(state_degree_days['monthly']['cdd'][year][month])
                else:
                    state_degree_days['monthly']['cdd'][year][month] = 0
        
        # Save degree day data for this state
        filename = os.path.join(degree_day_dir, f"{state}_degree_days.json")
        with open(filename, 'w') as f:
            json.dump(state_degree_days, f, indent=2)

def create_indexes(conn: sqlite3.Connection) -> None:
    """Create efficient indexes for database queries"""
    print("Creating database indexes...")
    
    # Indexes for daily_weather table
    conn.execute("CREATE INDEX IF NOT EXISTS idx_daily_weather_date ON daily_weather(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_daily_weather_location ON daily_weather(location_id)")
    
    # Indexes for monthly_stats table
    conn.execute("CREATE INDEX IF NOT EXISTS idx_monthly_stats_year_month ON monthly_stats(year, month)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_monthly_stats_location ON monthly_stats(location_id)")
    
    # Indexes for locations table
    conn.execute("CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_locations_zip ON locations(zip_code)")
    
    # Indexes for event_stats table
    conn.execute("CREATE INDEX IF NOT EXISTS idx_event_stats_location ON event_stats(location_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_event_stats_type ON event_stats(event_type)")

def main():
    """Main function to process weather data"""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Process weather data for Energy Audit System')
    parser.add_argument('--input', '-i', required=True, 
                        help='Path to input CSV file (e.g., WeatherEvents_Jan2016-Dec2022.csv)')
    parser.add_argument('--output-dir', '-o', default='processed_weather_data', 
                        help='Directory to store processed weather data')
    parser.add_argument('--chunk-size', '-c', type=int, default=100000, 
                        help='Number of rows to process at once')
    parser.add_argument('--state-filter', '-s', nargs='+', 
                        help='List of state codes to filter by (e.g., NY CA TX)')
    parser.add_argument('--max-chunks', '-m', type=int, 
                        help='Maximum number of chunks to process (for testing)')
    
    args = parser.parse_args()
    
    # Convert state filter to set if provided
    state_filter = set(args.state_filter) if args.state_filter else None
    
    # Process weather data
    summary = preprocess_weather_data(
        args.input, 
        args.output_dir, 
        chunk_size=args.chunk_size, 
        state_filter=state_filter,
        max_chunks=args.max_chunks
    )
    
    # Print summary
    print("\nProcessing Summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    main()
