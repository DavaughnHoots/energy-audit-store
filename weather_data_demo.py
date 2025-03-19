#!/usr/bin/env python3
"""
Weather Data Integration Demo for Energy Audit System

This script demonstrates how to use the weather data processing and integration
tools to enhance energy audit calculations. It shows a complete workflow from
preprocessing the raw weather data to using it for energy audit calculations.

Usage:
  python weather_data_demo.py --input WeatherEvents_Jan2016-Dec2022.csv --zipcode 90210
"""

import os
import sys
import argparse
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any

def run_preprocessing(input_file: str, output_dir: str, state_filter: str = None, max_chunks: int = None) -> bool:
    """
    Run the preprocessing script on the weather data
    
    Args:
        input_file: Path to the weather data CSV file
        output_dir: Directory to store processed output
        state_filter: Optional state to filter by (e.g., 'CA' or 'CA NY TX')
        max_chunks: Optional limit on number of chunks to process (for quick demo)
        
    Returns:
        True if preprocessing was successful, False otherwise
    """
    print("\n===== Step 1: Preprocessing Weather Data =====")
    
    # Build the command
    cmd = [
        sys.executable,
        "preprocess_weather_data.py",
        "--input", input_file,
        "--output-dir", output_dir
    ]
    
    if state_filter:
        cmd.extend(["--state-filter"] + state_filter.split())
    
    if max_chunks:
        cmd.extend(["--max-chunks", str(max_chunks)])
    
    print(f"Executing: {' '.join(cmd)}")
    
    # Run preprocessing script
    try:
        process = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("\nPreprocessing output:")
        print(process.stdout[-500:] if len(process.stdout) > 500 else process.stdout)  # Show last 500 chars
        
        # Check if output database was created
        db_path = os.path.join(output_dir, "weather_energy_data.db")
        if os.path.exists(db_path):
            print(f"\nPreprocessing successful! Database created at: {db_path}")
            return True
        else:
            print(f"Error: Database not found at {db_path}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"Error during preprocessing: {e}")
        print(f"Error output: {e.stderr}")
        return False

def demonstrate_integration(db_path: str, zipcode: str, state: str = None) -> Dict[str, Any]:
    """
    Demonstrate integrating weather data with energy audit calculations
    
    Args:
        db_path: Path to the processed weather database
        zipcode: ZIP code to use for the demonstration
        state: Optional state code
        
    Returns:
        Dictionary with demonstration results
    """
    print("\n===== Step 2: Weather Data Integration Demo =====")
    
    try:
        # Import the integration module
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from weather_data_integration import WeatherDataIntegration
        
        # Initialize integrator
        integrator = WeatherDataIntegration(db_path)
        
        # Find location data for the ZIP code
        print(f"\nFinding location data for ZIP code {zipcode}...")
        location = integrator.find_nearest_location(zipcode, state)
        
        if not location:
            print(f"No location found for ZIP code {zipcode}")
            return {"error": f"No location found for ZIP code {zipcode}"}
        
        print(f"Found location: {location['city']}, {location['state']} (Climate Zone: {location['climate_zone']})")
        
        # Create a results dictionary to store all demo outputs
        results = {
            "location": location,
            "demos": {}
        }
        
        # Demo 1: Get weather profile
        print("\nDemo 1: Weather Profile")
        profile = integrator.get_weather_profile(location["location_id"])
        
        print("Climate indicators:")
        print(f"  Heating Dominated: {profile['climate_indicators']['heating_dominated']}")
        print(f"  Cooling Dominated: {profile['climate_indicators']['cooling_dominated']}")
        print(f"  Annual HDD: {profile['climate_indicators']['annual_hdd']:.1f}")
        print(f"  Annual CDD: {profile['climate_indicators']['annual_cdd']:.1f}")
        
        results["demos"]["weather_profile"] = profile["climate_indicators"]
        
        # Demo 2: HVAC Energy Impact
        print("\nDemo 2: HVAC Energy Impact")
        
        # Use different building scenarios to show variety
        building_scenarios = [
            {"name": "Small Efficient Home", "size": 1500, "efficiency": 0.85},
            {"name": "Average Home", "size": 2500, "efficiency": 0.75},
            {"name": "Large Inefficient Home", "size": 4000, "efficiency": 0.65}
        ]
        
        hvac_results = {}
        
        for scenario in building_scenarios:
            print(f"\nScenario: {scenario['name']}")
            hvac_impact = integrator.get_weather_impact_for_hvac(
                location["location_id"],
                system_efficiency=scenario["efficiency"],
                square_footage=scenario["size"]
            )
            
            print(f"  Estimated Annual Energy Use: {hvac_impact['total_energy_kwh']:.1f} kWh")
            print(f"  Estimated Annual Cost: ${hvac_impact['estimated_annual_cost']:.2f}")
            print(f"  Potential Annual Savings: ${hvac_impact['potential_annual_savings']:.2f}")
            print(f"  Efficiency Upgrade ROI: {hvac_impact['efficiency_upgrade_roi'] * 100:.1f}%")
            
            hvac_results[scenario["name"]] = {
                "energy_kwh": round(hvac_impact["total_energy_kwh"], 1),
                "annual_cost": round(hvac_impact["estimated_annual_cost"], 2),
                "potential_savings": round(hvac_impact["potential_annual_savings"], 2),
                "roi_percentage": round(hvac_impact["efficiency_upgrade_roi"] * 100, 1)
            }
        
        results["demos"]["hvac_impact"] = hvac_results
        
        # Demo 3: Weather-Normalized Consumption
        print("\nDemo 3: Weather-Normalized Consumption")
        
        # Create sample consumption data (simulating monthly utility bills)
        current_date = datetime.now()
        consumption_data = []
        
        # Create 12 months of sample data with seasonal pattern
        for i in range(12):
            month_date = current_date - timedelta(days=30 * i)
            # Create a seasonal pattern (higher in winter/summer, lower in spring/fall)
            # This is just for demonstration, actual data would come from user input
            month = month_date.month
            
            # Simulate seasonal variation (northern hemisphere pattern)
            if month in [12, 1, 2]:  # Winter
                base_value = 1500  # High heating usage
            elif month in [6, 7, 8]:  # Summer
                base_value = 1300  # High cooling usage
            else:  # Spring/Fall
                base_value = 900  # Lower usage
                
            # Add some random variation
            import random
            variation = random.uniform(0.9, 1.1)
            
            consumption_data.append({
                "date": month_date.strftime("%Y-%m-%d"),
                "value": base_value * variation
            })
        
        # Sort chronologically
        consumption_data.sort(key=lambda x: x["date"])
        
        # Get weather normalization factors
        adjustment_factors = integrator.get_seasonal_adjustment_factors(location["location_id"])
        
        print("\nSeasonal adjustment factors by month:")
        for month, factor in adjustment_factors.items():
            month_name = datetime(2020, month, 1).strftime("%B")
            print(f"  {month_name}: {factor:.2f}")
        
        # Normalize the consumption data
        normalized_data = integrator.calculate_weather_normalized_consumption(
            consumption_data,
            location["location_id"]
        )
        
        print("\nConsumption data with weather normalization:")
        print("Date         | Original (kWh) | Weather Factor | Normalized (kWh)")
        print("--------------------------------------------------------------")
        
        normalization_examples = []
        for i, item in enumerate(normalized_data):
            if i < 5:  # Just show a few examples
                print(f"{item['date']} | {item['value']:13.1f} | {item['weather_factor']:14.2f} | {item['normalized_value']:15.1f}")
            
            normalization_examples.append({
                "date": item["date"],
                "original_kwh": round(item["value"], 1),
                "weather_factor": round(item["weather_factor"], 2),
                "normalized_kwh": round(item["normalized_value"], 1)
            })
        
        results["demos"]["weather_normalization"] = {
            "adjustment_factors": adjustment_factors,
            "examples": normalization_examples
        }
        
        # Demo 4: Degree Days Calculation
        print("\nDemo 4: Heating and Cooling Degree Days")
        
        # Calculate degree days for the previous year
        end_date = datetime.now()
        start_date = datetime(end_date.year - 1, end_date.month, end_date.day)
        
        degree_days = integrator.get_degree_days(
            location["location_id"],
            start_date.strftime("%Y-%m-%d"),
            end_date.strftime("%Y-%m-%d")
        )
        
        print(f"Time period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"Total Heating Degree Days: {degree_days['total_hdd']:.1f}")
        print(f"Total Cooling Degree Days: {degree_days['total_cdd']:.1f}")
        print(f"Average Daily HDD: {degree_days['avg_hdd']:.2f}")
        print(f"Average Daily CDD: {degree_days['avg_cdd']:.2f}")
        print(f"Based on {degree_days['days_count']} days of data")
        print(f"Estimated data: {'Yes' if degree_days.get('is_estimated', False) else 'No'}")
        
        results["demos"]["degree_days"] = {
            "time_period": {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            },
            "total_hdd": round(degree_days["total_hdd"], 1),
            "total_cdd": round(degree_days["total_cdd"], 1),
            "avg_hdd": round(degree_days["avg_hdd"], 2),
            "avg_cdd": round(degree_days["avg_cdd"], 2),
            "days_count": degree_days["days_count"],
            "is_estimated": degree_days.get("is_estimated", False)
        }
        
        print("\nDemonstration completed successfully!")
        
        # Close the database connection
        integrator.close()
        
        return results
    
    except Exception as e:
        print(f"Error during integration demonstration: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

def main():
    """Main function to run the weather data demo"""
    parser = argparse.ArgumentParser(description="Weather Data Integration Demo")
    parser.add_argument("--input", "-i", required=True, help="Path to weather data CSV file")
    parser.add_argument("--output-dir", "-o", default="processed_weather_data", help="Output directory for processed data")
    parser.add_argument("--zipcode", "-z", required=True, help="ZIP code for the demo")
    parser.add_argument("--state", "-s", help="State code (e.g., CA)")
    parser.add_argument("--max-chunks", "-m", type=int, help="Maximum chunks to process (for quick demo)")
    parser.add_argument("--output-file", "-f", default="weather_demo_results.json", help="Output file for demo results")
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Step 1: Preprocess the weather data
    db_path = os.path.join(args.output_dir, "weather_energy_data.db")
    
    # Only run preprocessing if the database doesn't exist yet
    if not os.path.exists(db_path):
        success = run_preprocessing(
            args.input, 
            args.output_dir, 
            args.state, 
            args.max_chunks
        )
        
        if not success:
            print("Preprocessing failed. Exiting.")
            return 1
    else:
        print(f"\nUsing existing weather database: {db_path}")
    
    # Step 2: Demonstrate integration
    results = demonstrate_integration(db_path, args.zipcode, args.state)
    
    # Save results to a file
    with open(args.output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDemo results saved to: {args.output_file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
