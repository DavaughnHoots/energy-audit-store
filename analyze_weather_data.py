#!/usr/bin/env python3
"""
WeatherData Analyzer for Energy Consumption Forecasting
This script analyzes the WeatherEvents_Jan2016-Dec2022.csv file and generates
a report on weather patterns relevant for energy consumption forecasting.
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime
import matplotlib.pyplot as plt
from pathlib import Path
import argparse
import time
import sys

def analyze_weather_data(file_path, chunk_size=100000):
    """
    Analyze the weather data file and generate a report.
    Uses chunking to handle large files efficiently.
    
    Args:
        file_path (str): Path to the CSV file
        chunk_size (int): Size of chunks to process at once
        
    Returns:
        dict: Report data containing analysis results
    """
    start_time = time.time()
    
    # First check file size to warn about memory usage
    file_size_gb = os.path.getsize(file_path) / (1024 ** 3)
    print(f"File size: {file_size_gb:.2f} GB")
    
    # Read the first few rows to get column structure
    print("Reading file header and sample rows...")
    sample_df = pd.read_csv(file_path, nrows=5)
    print("\nColumn structure:")
    print(sample_df.columns.tolist())
    print("\nData sample:")
    print(sample_df.head())
    
    # Prepare data containers
    date_range = [None, None]  # [min_date, max_date]
    locations = set()
    event_types = set()
    temp_stats = {
        'min': float('inf'),
        'max': float('-inf'),
        'values_by_month': {m: [] for m in range(1, 13)},
        'count': 0,
        'sum': 0
    }
    heating_degree_days = {m: [] for m in range(1, 13)}
    cooling_degree_days = {m: [] for m in range(1, 13)}
    precip_stats = {
        'has_precipitation': 0,
        'total_rows': 0,
        'values_by_month': {m: [] for m in range(1, 13)}
    }
    
    # Define columns we need
    date_col = None  # Will detect from headers
    location_col = None
    temp_col = None
    event_type_col = None
    precip_col = None
    
    # Find the right column names by examining headers
    for col in sample_df.columns:
        lower_col = col.lower()
        if 'date' in lower_col or 'time' in lower_col:
            date_col = col
        elif 'city' in lower_col or 'location' in lower_col or 'state' in lower_col or 'zip' in lower_col:
            location_col = col
        elif 'temp' in lower_col:
            temp_col = col
        elif 'event' in lower_col or 'type' in lower_col or 'weather' in lower_col:
            event_type_col = col
        elif 'precip' in lower_col or 'rain' in lower_col or 'snow' in lower_col:
            precip_col = col
    
    print(f"\nDetected columns - Date: {date_col}, Location: {location_col}, Temperature: {temp_col}, Event Type: {event_type_col}, Precipitation: {precip_col}")
    
    # Define constants for degree day calculations
    BASE_TEMP_HEATING = 65.0  # °F - standard base for heating degree days
    BASE_TEMP_COOLING = 65.0  # °F - standard base for cooling degree days
    
    # Process file in chunks
    chunks_processed = 0
    total_rows = 0
    
    print("\nProcessing file in chunks...")
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        chunks_processed += 1
        total_rows += len(chunk)
        
        if chunks_processed % 10 == 0:
            elapsed = time.time() - start_time
            print(f"Processed {chunks_processed} chunks ({total_rows:,} rows) in {elapsed:.2f} seconds...") 
        
        # Check if the date column needs to be converted
        if date_col and date_col in chunk.columns:
            try:
                chunk[date_col] = pd.to_datetime(chunk[date_col])
                
                # Update date range
                chunk_min = chunk[date_col].min()
                chunk_max = chunk[date_col].max()
                
                if date_range[0] is None or chunk_min < date_range[0]:
                    date_range[0] = chunk_min
                if date_range[1] is None or chunk_max > date_range[1]:
                    date_range[1] = chunk_max
            except Exception as e:
                print(f"Warning: Could not process dates in chunk {chunks_processed}: {str(e)}")
        
        # Process each row for temperature and other data
        for _, row in chunk.iterrows():
            # Extract month if date is available
            month = None
            try:
                if date_col and pd.notna(row[date_col]):
                    month = row[date_col].month
            except:
                pass
                
            # Process temperature data
            if temp_col and temp_col in chunk.columns and pd.notna(row[temp_col]):
                try:
                    temp_value = float(row[temp_col])
                    temp_stats['count'] += 1
                    temp_stats['sum'] += temp_value
                    temp_stats['min'] = min(temp_stats['min'], temp_value)
                    temp_stats['max'] = max(temp_stats['max'], temp_value)
                    
                    # Add to monthly data if month is available
                    if month:
                        temp_stats['values_by_month'][month].append(temp_value)
                        
                        # Calculate heating and cooling degree days
                        if temp_value < BASE_TEMP_HEATING:
                            heating_degree_days[month].append(BASE_TEMP_HEATING - temp_value)
                        if temp_value > BASE_TEMP_COOLING:
                            cooling_degree_days[month].append(temp_value - BASE_TEMP_COOLING)
                except:
                    pass
        
        # Collect location information
        if location_col and location_col in chunk.columns:
            locations.update(chunk[location_col].dropna().unique())
        
        # Collect event types
        if event_type_col and event_type_col in chunk.columns:
            event_types.update(chunk[event_type_col].dropna().unique())
        
        # Collect precipitation stats
        if precip_col and precip_col in chunk.columns:
            precip_stats['has_precipitation'] += chunk[precip_col].notna().sum()
            
            # Process precipitation by month
            if date_col and date_col in chunk.columns:
                for _, row in chunk.iterrows():
                    if pd.notna(row[precip_col]) and pd.notna(row[date_col]):
                        try:
                            month = row[date_col].month
                            precip_value = float(row[precip_col])
                            precip_stats['values_by_month'][month].append(precip_value)
                        except:
                            pass
        
        precip_stats['total_rows'] += len(chunk)
    
    print(f"\nProcessing complete! Analyzed {total_rows:,} rows in {chunks_processed} chunks.")
    
    # Calculate monthly temperature averages
    monthly_avg_temps = {}
    for month, values in temp_stats['values_by_month'].items():
        if values:
            monthly_avg_temps[month] = sum(values) / len(values)
        else:
            monthly_avg_temps[month] = None
    
    # Calculate monthly degree days
    monthly_hdd = {}
    monthly_cdd = {}
    for month in range(1, 13):
        monthly_hdd[month] = sum(heating_degree_days[month]) if heating_degree_days[month] else 0
        monthly_cdd[month] = sum(cooling_degree_days[month]) if cooling_degree_days[month] else 0
    
    # Calculate monthly precipitation averages
    monthly_avg_precip = {}
    for month, values in precip_stats['values_by_month'].items():
        if values:
            monthly_avg_precip[month] = sum(values) / len(values)
        else:
            monthly_avg_precip[month] = None
    
    # Generate report
    report = {
        'file_size_gb': file_size_gb,
        'total_rows': total_rows,
        'date_range': date_range,
        'total_locations': len(locations),
        'locations_sample': list(locations)[:10] if len(locations) > 10 else list(locations),
        'event_types': sorted(list(event_types)),
        'temperature_range': [temp_stats['min'], temp_stats['max']],
        'temperature_average': temp_stats['sum'] / temp_stats['count'] if temp_stats['count'] > 0 else None,
        'monthly_avg_temperatures': monthly_avg_temps,
        'monthly_heating_degree_days': monthly_hdd,
        'monthly_cooling_degree_days': monthly_cdd,
        'monthly_avg_precipitation': monthly_avg_precip,
        'precipitation_frequency': precip_stats['has_precipitation'] / precip_stats['total_rows'] if precip_stats['total_rows'] > 0 else 0
    }
    
    return report

def generate_visualizations(report, output_dir):
    """
    Generate visualizations from the report data
    
    Args:
        report (dict): Report data containing analysis results
        output_dir (str): Directory to save visualizations
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Monthly temperature plot
    if all(v is not None for v in report['monthly_avg_temperatures'].values()):
        months = list(report['monthly_avg_temperatures'].keys())
        temps = list(report['monthly_avg_temperatures'].values())
        
        plt.figure(figsize=(12, 6))
        plt.bar(months, temps, color='skyblue')
        plt.xlabel('Month')
        plt.ylabel('Average Temperature (°F)')
        plt.title('Monthly Average Temperatures')
        plt.xticks(months, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.savefig(os.path.join(output_dir, 'monthly_temperatures.png'))
        plt.close()
    
    # Heating and Cooling Degree Days
    if report['monthly_heating_degree_days'] and report['monthly_cooling_degree_days']:
        months = list(range(1, 13))
        hdd_values = [report['monthly_heating_degree_days'][m] for m in months]
        cdd_values = [report['monthly_cooling_degree_days'][m] for m in months]
        
        plt.figure(figsize=(12, 6))
        
        # Plot both on the same graph with different colors
        plt.bar(months, hdd_values, color='blue', alpha=0.6, label='Heating Degree Days')
        plt.bar(months, cdd_values, color='red', alpha=0.6, label='Cooling Degree Days')
        
        plt.xlabel('Month')
        plt.ylabel('Degree Days')
        plt.title('Monthly Heating and Cooling Degree Days')
        plt.xticks(months, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.savefig(os.path.join(output_dir, 'degree_days.png'))
        plt.close()
    
    # Monthly precipitation
    if any(v is not None for v in report['monthly_avg_precipitation'].values()):
        months = list(report['monthly_avg_precipitation'].keys())
        precip = [report['monthly_avg_precipitation'][m] if report['monthly_avg_precipitation'][m] is not None else 0 for m in months]
        
        plt.figure(figsize=(12, 6))
        plt.bar(months, precip, color='lightblue')
        plt.xlabel('Month')
        plt.ylabel('Average Precipitation')
        plt.title('Monthly Average Precipitation')
        plt.xticks(months, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.savefig(os.path.join(output_dir, 'monthly_precipitation.png'))
        plt.close()

def main():
    parser = argparse.ArgumentParser(description='Analyze weather data for energy consumption forecasting')
    parser.add_argument('--file', '-f', type=str, help='Path to the weather data CSV file', 
                        default="WeatherEvents_Jan2016-Dec2022.csv")
    parser.add_argument('--chunk-size', '-c', type=int, default=100000, 
                        help='Chunk size for processing large files (default: 100000)')
    parser.add_argument('--output-dir', '-o', type=str, default="weather_analysis_report",
                        help='Output directory for report and visualizations')
    
    args = parser.parse_args()
    
    # Validate file exists
    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        return 1
    
    # Set up output directory
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Analyzing weather data from: {args.file}")
    report = analyze_weather_data(args.file, chunk_size=args.chunk_size)
    
    # Output the report
    report_path = os.path.join(output_dir, "weather_data_report.txt")
    with open(report_path, "w") as f:
        f.write("Weather Data Analysis Report\n")
        f.write("===========================\n\n")
        f.write(f"File size: {report['file_size_gb']:.2f} GB\n")
        f.write(f"Total rows analyzed: {report['total_rows']:,}\n")
        f.write(f"Date range: {report['date_range'][0]} to {report['date_range'][1]}\n\n")
        
        f.write("Location Information:\n")
        f.write(f"Total unique locations: {report['total_locations']}\n")
        f.write(f"Location samples: {', '.join(str(loc) for loc in report['locations_sample'])}\n\n")
        
        f.write("Event Types:\n")
        f.write(f"{', '.join(report['event_types'])}\n\n")
        
        f.write("Temperature Data:\n")
        f.write(f"Range: {report['temperature_range'][0]:.1f} to {report['temperature_range'][1]:.1f} °F\n")
        f.write(f"Overall average: {report['temperature_average']:.1f} °F\n\n")
        
        f.write("Monthly Average Temperatures (°F):\n")
        for month, temp in report['monthly_avg_temperatures'].items():
            month_name = datetime(2020, month, 1).strftime('%B')
            f.write(f"  {month_name}: {temp:.1f}\n" if temp else f"  {month_name}: No data\n")
        
        f.write("\nMonthly Heating Degree Days:\n")
        for month, value in report['monthly_heating_degree_days'].items():
            month_name = datetime(2020, month, 1).strftime('%B')
            f.write(f"  {month_name}: {value:.1f}\n")
        
        f.write("\nMonthly Cooling Degree Days:\n")
        for month, value in report['monthly_cooling_degree_days'].items():
            month_name = datetime(2020, month, 1).strftime('%B')
            f.write(f"  {month_name}: {value:.1f}\n")
        
        f.write("\nPrecipitation Data:\n")
        f.write(f"Precipitation frequency: {report['precipitation_frequency']:.2%}\n\n")
        
        f.write("Monthly Average Precipitation:\n")
        for month, value in report['monthly_avg_precipitation'].items():
            month_name = datetime(2020, month, 1).strftime('%B')
            f.write(f"  {month_name}: {value:.3f}\n" if value else f"  {month_name}: No data\n")
        
        f.write("\nRecommendations for Energy Consumption Forecasting:\n")
        f.write("  1. Use monthly temperature patterns for seasonal decomposition\n")
        f.write("  2. Incorporate heating and cooling degree days for energy usage forecasting\n")
        f.write("  3. Consider event types for anomaly detection in energy usage\n")
        f.write("  4. Use precipitation data as a secondary factor in consumption models\n")
        f.write("  5. Develop region-specific models if data spans multiple locations\n")
    
    print(f"Report generated at: {report_path}")
    
    # Generate visualizations
    try:
        generate_visualizations(report, output_dir)
        print(f"Visualizations saved to: {output_dir}")
    except Exception as e:
        print(f"Error generating visualizations: {str(e)}")
    
    # Generate JSON version of the report for potential programmatic use
    json_path = os.path.join(output_dir, "weather_data_report.json")
    try:
        import json
        
        # Convert dates to strings for JSON serialization
        json_report = report.copy()
        if json_report['date_range'][0]:
            json_report['date_range'][0] = json_report['date_range'][0].strftime('%Y-%m-%d')
        if json_report['date_range'][1]:
            json_report['date_range'][1] = json_report['date_range'][1].strftime('%Y-%m-%d')
        
        with open(json_path, 'w') as f:
            json.dump(json_report, f, indent=2)
        print(f"JSON report saved to: {json_path}")
    except Exception as e:
        print(f"Error saving JSON report: {str(e)}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
