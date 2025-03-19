#!/usr/bin/env python3
"""
Synthetic Weather Data Generator

This script generates synthetic weather data for testing the weather data analyzer.
It creates patterns similar to real weather data with seasonal variations, random events,
and realistic temperature distributions.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

def generate_synthetic_weather_data(output_file, start_date='2020-01-01', end_date='2022-12-31', num_locations=5):
    """
    Generate synthetic weather data for testing.
    
    Args:
        output_file: Path to save the CSV file
        start_date: Start date for the data (YYYY-MM-DD)
        end_date: End date for the data (YYYY-MM-DD)
        num_locations: Number of different locations to generate data for
    """
    # Convert dates to datetime objects
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    # Create date range
    date_range = []
    current = start
    while current <= end:
        date_range.append(current)
        current += timedelta(days=1)
    
    # Create location names
    locations = [f"City_{i}" for i in range(1, num_locations + 1)]
    
    # Create weather event types
    event_types = ["Clear", "Rain", "Snow", "Thunderstorm", "Fog", "Hail", "Windy", "Cloudy"]
    
    # Lists to hold data
    dates = []
    temps = []
    locs = []
    events = []
    precips = []
    
    # Generate data for each location
    for location in locations:
        # Set base temperature and seasonal variation parameters for this location
        base_temp = random.uniform(50, 65)  # Base annual temperature
        seasonal_amplitude = random.uniform(15, 30)  # Seasonal temperature swing
        
        for date in date_range:
            # Add to date list
            dates.append(date)
            
            # Add location
            locs.append(location)
            
            # Calculate day of year (0-365)
            day_of_year = date.timetuple().tm_yday
            
            # Calculate seasonal component (sine wave with 1-year period)
            # Shift by 20 days so peak is in mid-July
            seasonal_offset = 20
            seasonal_factor = np.sin(2 * np.pi * (day_of_year + seasonal_offset) / 365.25)
            seasonal_temp = base_temp + seasonal_amplitude * seasonal_factor
            
            # Add random daily variation
            daily_variation = np.random.normal(0, 5)  # Random daily fluctuation
            
            # Add some year-to-year variation
            year_factor = (date.year - start.year) * random.uniform(-1, 1)
            
            # Calculate final temperature
            temp = seasonal_temp + daily_variation + year_factor
            temps.append(round(temp, 1))
            
            # Determine weather event based on temperature and randomness
            if temp < 32 and random.random() < 0.7:
                event = "Snow"
                precip = random.uniform(0, 2) if random.random() < 0.8 else 0
            elif temp < 45 and random.random() < 0.4:
                event = "Rain"
                precip = random.uniform(0, 1) if random.random() < 0.8 else 0
            elif 45 <= temp < 75 and random.random() < 0.3:
                event = "Rain"
                precip = random.uniform(0, 1.5) if random.random() < 0.7 else 0
            elif temp >= 75 and random.random() < 0.2:
                # Higher chance of thunderstorms in hot weather
                if random.random() < 0.4:
                    event = "Thunderstorm"
                    precip = random.uniform(0.5, 3)
                else:
                    event = "Rain"
                    precip = random.uniform(0, 2)
            elif random.random() < 0.1:
                # Random other events
                event = random.choice(["Fog", "Windy", "Cloudy"])
                precip = 0
            else:
                event = "Clear"
                precip = 0
            
            events.append(event)
            precips.append(round(precip, 2))
    
    # Create DataFrame
    df = pd.DataFrame({
        'Date': dates,
        'Location': locs,
        'Temperature': temps,
        'WeatherEvent': events,
        'Precipitation': precips
    })
    
    # Save to CSV
    print(f"Generating {len(df)} records of synthetic weather data...")
    df.to_csv(output_file, index=False)
    print(f"Data saved to {output_file}")
    print(f"File size: {os.path.getsize(output_file) / (1024*1024):.2f} MB")
    
    # Preview
    print("\nData preview:")
    print(df.head())
    
    # Summary statistics
    print("\nSummary statistics:")
    print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
    print(f"Number of locations: {df['Location'].nunique()}")
    print(f"Temperature range: {df['Temperature'].min():.1f} to {df['Temperature'].max():.1f}")
    print(f"Weather events: {df['WeatherEvent'].value_counts().to_dict()}")
    print(f"Average precipitation: {df['Precipitation'].mean():.2f}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate synthetic weather data for testing')
    parser.add_argument('--output', '-o', type=str, default='synthetic_weather_data.csv',
                       help='Output file path (default: synthetic_weather_data.csv)')
    parser.add_argument('--start-date', type=str, default='2020-01-01',
                       help='Start date YYYY-MM-DD (default: 2020-01-01)')
    parser.add_argument('--end-date', type=str, default='2022-12-31',
                       help='End date YYYY-MM-DD (default: 2022-12-31)')
    parser.add_argument('--locations', type=int, default=5,
                       help='Number of locations (default: 5)')
    
    args = parser.parse_args()
    
    generate_synthetic_weather_data(
        args.output,
        start_date=args.start_date,
        end_date=args.end_date,
        num_locations=args.locations
    )
