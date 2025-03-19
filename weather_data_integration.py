#!/usr/bin/env python3
"""
Weather Data Integration for Energy Audit System

This script provides utilities to integrate the processed weather data from the 
WeatherEvents database with the Energy Audit system. It provides functions to 
retrieve relevant weather data for specific locations and time periods to enhance
HVAC efficiency calculations and energy consumption analysis.

Usage:
  Import this module in other scripts or use the command line interface
  python weather_data_integration.py --db-path processed_weather_data/weather_energy_data.db
"""

import os
import json
import sqlite3
import argparse
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Union, Optional, Any

# Constants
BASE_TEMP_HEATING = 65.0  # °F - standard base for heating degree days
BASE_TEMP_COOLING = 65.0  # °F - standard base for cooling degree days

class WeatherDataIntegration:
    """Class for integrating weather data with energy audit system"""
    
    def __init__(self, db_path: str):
        """
        Initialize the weather data integration
        
        Args:
            db_path: Path to the SQLite database containing processed weather data
        """
        self.db_path = db_path
        self.conn = None
        self.connect()
    
    def connect(self) -> None:
        """Connect to the SQLite database"""
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Weather database not found at {self.db_path}")
        
        self.conn = sqlite3.connect(self.db_path)
        # Enable dictionary access to rows
        self.conn.row_factory = sqlite3.Row
    
    def close(self) -> None:
        """Close the database connection"""
        if self.conn:
            self.conn.close()
    
    def find_nearest_location(self, zip_code: str, state: str = None) -> Optional[Dict[str, Any]]:
        """
        Find the nearest location with weather data for a given zip code
        
        Args:
            zip_code: ZIP code to search for
            state: Optional state code to refine search
            
        Returns:
            Dictionary with location information or None if not found
        """
        if not self.conn:
            self.connect()
        
        # First try exact match
        if state:
            cursor = self.conn.execute(
                "SELECT * FROM locations WHERE zip_code = ? AND state = ?",
                (zip_code, state)
            )
        else:
            cursor = self.conn.execute(
                "SELECT * FROM locations WHERE zip_code = ?",
                (zip_code,)
            )
        
        row = cursor.fetchone()
        if row:
            return dict(row)
        
        # If no exact match, find the nearest location in the same state
        if state:
            cursor = self.conn.execute(
                "SELECT * FROM locations WHERE state = ? LIMIT 1",
                (state,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
        
        # If still no match, just get the first location
        cursor = self.conn.execute("SELECT * FROM locations LIMIT 1")
        row = cursor.fetchone()
        if row:
            return dict(row)
        
        return None
    
    def get_degree_days(
        self, 
        location_id: str, 
        start_date: str, 
        end_date: str
    ) -> Dict[str, Any]:
        """
        Get heating and cooling degree days for a location and time period
        
        Args:
            location_id: Location ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary with heating and cooling degree days
        """
        if not self.conn:
            self.connect()
        
        cursor = self.conn.execute(
            """
            SELECT 
                SUM(heating_degree_days) as total_hdd,
                SUM(cooling_degree_days) as total_cdd,
                AVG(heating_degree_days) as avg_hdd,
                AVG(cooling_degree_days) as avg_cdd,
                COUNT(*) as days_count
            FROM daily_weather
            WHERE location_id = ? AND date >= ? AND date <= ?
            """,
            (location_id, start_date, end_date)
        )
        
        row = cursor.fetchone()
        
        if not row or row['days_count'] == 0:
            # No data for the specified period, use monthly averages
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            days_diff = (end - start).days + 1
            
            # Get monthly averages
            cursor = self.conn.execute(
                """
                SELECT 
                    AVG(total_heating_degree_days/30) as avg_daily_hdd,
                    AVG(total_cooling_degree_days/30) as avg_daily_cdd
                FROM monthly_stats
                WHERE location_id = ? AND 
                      ((year = ? AND month >= ?) OR (year > ?)) AND
                      ((year = ? AND month <= ?) OR (year < ?))
                """,
                (
                    location_id, 
                    start.year, start.month, start.year,
                    end.year, end.month, end.year
                )
            )
            
            monthly_avg = cursor.fetchone()
            
            if monthly_avg and monthly_avg['avg_daily_hdd'] is not None:
                return {
                    'total_hdd': monthly_avg['avg_daily_hdd'] * days_diff,
                    'total_cdd': monthly_avg['avg_daily_cdd'] * days_diff,
                    'avg_hdd': monthly_avg['avg_daily_hdd'],
                    'avg_cdd': monthly_avg['avg_daily_cdd'],
                    'days_count': days_diff,
                    'is_estimated': True
                }
            
            # If still no data, estimate based on climate zone
            cursor = self.conn.execute(
                "SELECT climate_zone FROM locations WHERE location_id = ?",
                (location_id,)
            )
            location = cursor.fetchone()
            if location:
                climate_zone = location['climate_zone']
                # Rough estimates by climate zone
                zone_estimates = {
                    1: {'hdd': 0.5, 'cdd': 8.0},    # Hot/tropical
                    2: {'hdd': 2.0, 'cdd': 5.0},    # Hot/warm
                    3: {'hdd': 5.0, 'cdd': 3.0},    # Mixed/moderate
                    4: {'hdd': 8.0, 'cdd': 1.0},    # Mixed/cold
                    5: {'hdd': 12.0, 'cdd': 0.5},   # Cold
                }
                
                if climate_zone in zone_estimates:
                    est = zone_estimates[climate_zone]
                    return {
                        'total_hdd': est['hdd'] * days_diff,
                        'total_cdd': est['cdd'] * days_diff,
                        'avg_hdd': est['hdd'],
                        'avg_cdd': est['cdd'],
                        'days_count': days_diff,
                        'is_estimated': True,
                        'estimation_method': 'climate_zone'
                    }
            
            # Last resort fallback
            return {
                'total_hdd': 5.0 * days_diff,  # Generic estimate
                'total_cdd': 3.0 * days_diff,  # Generic estimate
                'avg_hdd': 5.0,
                'avg_cdd': 3.0,
                'days_count': days_diff,
                'is_estimated': True,
                'estimation_method': 'generic'
            }
        
        return {
            'total_hdd': row['total_hdd'] or 0,
            'total_cdd': row['total_cdd'] or 0,
            'avg_hdd': row['avg_hdd'] or 0,
            'avg_cdd': row['avg_cdd'] or 0,
            'days_count': row['days_count'],
            'is_estimated': False
        }
    
    def get_weather_profile(
        self, 
        location_id: str, 
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get weather profile for a location and optional year
        
        Args:
            location_id: Location ID
            year: Optional year to filter by (default: most recent year with data)
            
        Returns:
            Dictionary with weather profile data
        """
        if not self.conn:
            self.connect()
        
        # Get location data
        cursor = self.conn.execute(
            "SELECT * FROM locations WHERE location_id = ?",
            (location_id,)
        )
        location = cursor.fetchone()
        
        if not location:
            return {'error': f"Location {location_id} not found"}
        
        profile = {
            'location': dict(location),
            'monthly_data': {},
            'event_stats': {},
            'climate_indicators': {}
        }
        
        # Determine year if not specified
        if not year:
            cursor = self.conn.execute(
                "SELECT MAX(year) as max_year FROM monthly_stats WHERE location_id = ?",
                (location_id,)
            )
            row = cursor.fetchone()
            if row and row['max_year']:
                year = row['max_year']
            else:
                year = datetime.now().year
        
        # Get monthly statistics
        cursor = self.conn.execute(
            """
            SELECT * FROM monthly_stats 
            WHERE location_id = ? AND year = ?
            ORDER BY month
            """,
            (location_id, year)
        )
        
        monthly_data = {}
        for row in cursor:
            monthly_data[row['month']] = dict(row)
        
        profile['monthly_data'] = monthly_data
        
        # Get event statistics
        cursor = self.conn.execute(
            """
            SELECT * FROM event_stats
            WHERE location_id = ?
            ORDER BY count DESC
            """,
            (location_id,)
        )
        
        event_stats = {}
        for row in cursor:
            event_stats[row['event_type']] = dict(row)
        
        profile['event_stats'] = event_stats
        
        # Calculate climate indicators
        total_hdd = sum(month['total_heating_degree_days'] for month in monthly_data.values() if month['total_heating_degree_days'] is not None)
        total_cdd = sum(month['total_cooling_degree_days'] for month in monthly_data.values() if month['total_cooling_degree_days'] is not None)
        
        # Energy relevant climate indicators
        profile['climate_indicators'] = {
            'annual_hdd': total_hdd,
            'annual_cdd': total_cdd,
            'heating_dominated': total_hdd > total_cdd,
            'cooling_dominated': total_cdd > total_hdd,
            'extreme_events_frequency': sum(1 for evt in event_stats.values() if evt['avg_severity'] > 3.0),
            'severe_weather_score': sum(evt['energy_impact_score'] for evt in event_stats.values() if evt['energy_impact_score'] > 5.0),
            'estimated_annual_energy_impact': (total_hdd * 0.5 + total_cdd * 0.7) / 1000  # Simplified energy impact factor
        }
        
        return profile
    
    def get_seasonal_adjustment_factors(
        self, 
        location_id: str
    ) -> Dict[str, float]:
        """
        Get seasonal adjustment factors for energy consumption analysis
        
        Args:
            location_id: Location ID
            
        Returns:
            Dictionary with monthly seasonal adjustment factors
        """
        if not self.conn:
            self.connect()
        
        # Get monthly HDD and CDD values
        cursor = self.conn.execute(
            """
            SELECT 
                month,
                AVG(total_heating_degree_days) as avg_hdd,
                AVG(total_cooling_degree_days) as avg_cdd
            FROM monthly_stats
            WHERE location_id = ?
            GROUP BY month
            ORDER BY month
            """,
            (location_id,)
        )
        
        monthly_data = {}
        for row in cursor:
            monthly_data[row['month']] = {
                'hdd': row['avg_hdd'] or 0,
                'cdd': row['avg_cdd'] or 0
            }
        
        # Fill in any missing months with estimates
        for month in range(1, 13):
            if month not in monthly_data:
                # Estimate based on northern hemisphere seasons
                if month in [12, 1, 2]:  # Winter
                    monthly_data[month] = {'hdd': 20.0, 'cdd': 0.0}
                elif month in [3, 4, 5]:  # Spring
                    monthly_data[month] = {'hdd': 10.0, 'cdd': 5.0}
                elif month in [6, 7, 8]:  # Summer
                    monthly_data[month] = {'hdd': 0.0, 'cdd': 20.0}
                else:  # Fall
                    monthly_data[month] = {'hdd': 10.0, 'cdd': 5.0}
        
        # Calculate combined degree days
        for month in monthly_data:
            monthly_data[month]['combined'] = monthly_data[month]['hdd'] + monthly_data[month]['cdd']
        
        # Calculate average combined degree days
        avg_combined = sum(data['combined'] for data in monthly_data.values()) / 12
        
        # Calculate adjustment factors
        adjustment_factors = {}
        for month in monthly_data:
            if avg_combined > 0:
                factor = monthly_data[month]['combined'] / avg_combined
            else:
                factor = 1.0
            
            # Normalize factors (cap extreme values)
            factor = max(0.6, min(1.8, factor))
            adjustment_factors[month] = factor
        
        return adjustment_factors
    
    def calculate_weather_normalized_consumption(
        self, 
        consumption_data: List[Dict[str, Any]], 
        location_id: str,
        aggregation_period: str = 'monthly'
    ) -> List[Dict[str, Any]]:
        """
        Calculate weather-normalized energy consumption
        
        Args:
            consumption_data: List of energy consumption data points with date and value
            location_id: Location ID for weather data
            aggregation_period: Period for aggregation ('monthly' or 'daily')
            
        Returns:
            List of consumption data with added weather normalization
        """
        # Get seasonal adjustment factors
        adjustment_factors = self.get_seasonal_adjustment_factors(location_id)
        
        # Apply weather normalization
        normalized_data = []
        
        for item in consumption_data:
            try:
                # Parse date
                date = datetime.strptime(item['date'], '%Y-%m-%d')
                month = date.month
                
                # Get adjustment factor for this month
                factor = adjustment_factors.get(month, 1.0)
                
                # Create normalized item
                normalized_item = item.copy()
                normalized_item['weather_factor'] = factor
                normalized_item['normalized_value'] = item['value'] / factor
                
                normalized_data.append(normalized_item)
            except (KeyError, ValueError) as e:
                # Skip items with missing or invalid data
                print(f"Error normalizing consumption data: {e}")
                normalized_data.append(item)  # Keep original item
        
        return normalized_data
    
    def get_weather_impact_for_hvac(
        self, 
        location_id: str,
        system_efficiency: float = 0.8,
        square_footage: float = 2000,
        time_period: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Calculate weather impact on HVAC energy consumption
        
        Args:
            location_id: Location ID
            system_efficiency: HVAC system efficiency (0.0-1.0)
            square_footage: Building square footage
            time_period: Optional time period dict with 'start' and 'end' dates
            
        Returns:
            Dictionary with HVAC energy consumption estimates
        """
        # Set default time period to last year if not provided
        if not time_period:
            end_date = datetime.now()
            start_date = datetime(end_date.year - 1, end_date.month, 1)
            time_period = {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d')
            }
        
        # Get degree days
        degree_days = self.get_degree_days(
            location_id, 
            time_period['start'], 
            time_period['end']
        )
        
        # Calculate HVAC energy consumption estimates
        # These are simplified estimates based on industry rules of thumb
        
        # Energy consumption factors (BTU per sq ft per degree day)
        heating_factor = 1.5  # BTU/(sq ft * HDD)
        cooling_factor = 2.0  # BTU/(sq ft * CDD)
        
        # Convert to kWh (1 kWh = 3412 BTU)
        kWh_conversion = 1 / 3412
        
        # Adjust for system efficiency
        efficiency_factor = 1 / system_efficiency if system_efficiency > 0 else 1.25
        
        # Calculate energy consumption
        heating_energy_btu = degree_days['total_hdd'] * square_footage * heating_factor
        cooling_energy_btu = degree_days['total_cdd'] * square_footage * cooling_factor
        
        heating_energy_kwh = heating_energy_btu * kWh_conversion * efficiency_factor
        cooling_energy_kwh = cooling_energy_btu * kWh_conversion * efficiency_factor
        
        # Calculate potential savings with improved efficiency
        improved_efficiency = min(0.95, system_efficiency + 0.2)  # 20% improvement, capped at 95%
        improved_efficiency_factor = 1 / improved_efficiency
        
        improved_heating_kwh = heating_energy_btu * kWh_conversion * improved_efficiency_factor
        improved_cooling_kwh = cooling_energy_btu * kWh_conversion * improved_efficiency_factor
        
        heating_savings = heating_energy_kwh - improved_heating_kwh
        cooling_savings = cooling_energy_kwh - improved_cooling_kwh
        
        # Estimate typical residential electricity cost ($0.14/kWh)
        electricity_rate = 0.14  # $/kWh
        
        # Calculate potential annual savings
        annual_savings = (heating_savings + cooling_savings) * electricity_rate
        
        return {
            'degree_days': degree_days,
            'heating_energy_kwh': heating_energy_kwh,
            'cooling_energy_kwh': cooling_energy_kwh,
            'total_energy_kwh': heating_energy_kwh + cooling_energy_kwh,
            'estimated_annual_cost': (heating_energy_kwh + cooling_energy_kwh) * electricity_rate,
            'potential_annual_savings': annual_savings,
            'efficiency_upgrade_roi': annual_savings / (square_footage * 1.5)  # Rough ROI based on upgrade cost
        }


def main():
    """Command line interface for weather data integration"""
    parser = argparse.ArgumentParser(description='Integrate weather data with energy audit system')
    parser.add_argument('--db-path', required=True, help='Path to weather database')
    parser.add_argument('--zipcode', help='ZIP code to query')
    parser.add_argument('--state', help='State code to filter by')
    parser.add_argument('--output', '-o', help='Output file for results (JSON)')
    parser.add_argument('--action', choices=['profile', 'degree-days', 'hvac-impact', 'adjustment-factors'],
                        default='profile', help='Action to perform')
    
    args = parser.parse_args()
    
    try:
        integrator = WeatherDataIntegration(args.db_path)
        
        if args.action == 'profile':
            if not args.zipcode:
                print("ZIP code is required for weather profile")
                return 1
            
            # Find nearest location for the ZIP code
            location = integrator.find_nearest_location(args.zipcode, args.state)
            
            if not location:
                print(f"No weather data found for ZIP code {args.zipcode}")
                return 1
            
            # Get weather profile
            profile = integrator.get_weather_profile(location['location_id'])
            
            # Print or save results
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(profile, f, indent=2)
                print(f"Weather profile saved to {args.output}")
            else:
                print(json.dumps(profile, indent=2))
        
        elif args.action == 'degree-days':
            if not args.zipcode:
                print("ZIP code is required for degree days calculation")
                return 1
            
            # Find nearest location for the ZIP code
            location = integrator.find_nearest_location(args.zipcode, args.state)
            
            if not location:
                print(f"No weather data found for ZIP code {args.zipcode}")
                return 1
            
            # Calculate degree days for the past year
            end_date = datetime.now()
            start_date = datetime(end_date.year - 1, end_date.month, 1)
            
            degree_days = integrator.get_degree_days(
                location['location_id'],
                start_date.strftime('%Y-%m-%d'),
                end_date.strftime('%Y-%m-%d')
            )
            
            # Print or save results
            result = {
                'location': location,
                'degree_days': degree_days,
                'time_period': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d')
                }
            }
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"Degree days data saved to {args.output}")
            else:
                print(json.dumps(result, indent=2))
        
        elif args.action == 'hvac-impact':
            if not args.zipcode:
                print("ZIP code is required for HVAC impact calculation")
                return 1
            
            # Find nearest location for the ZIP code
            location = integrator.find_nearest_location(args.zipcode, args.state)
            
            if not location:
                print(f"No weather data found for ZIP code {args.zipcode}")
                return 1
            
            # Calculate HVAC impact with default values
            hvac_impact = integrator.get_weather_impact_for_hvac(
                location['location_id'],
                system_efficiency=0.8,
                square_footage=2000
            )
            
            # Print or save results
            result = {
                'location': location,
                'hvac_impact': hvac_impact
            }
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"HVAC impact data saved to {args.output}")
            else:
                print(json.dumps(result, indent=2))
        
        elif args.action == 'adjustment-factors':
            if not args.zipcode:
                print("ZIP code is required for adjustment factors calculation")
                return 1
            
            # Find nearest location for the ZIP code
            location = integrator.find_nearest_location(args.zipcode, args.state)
            
            if not location:
                print(f"No weather data found for ZIP code {args.zipcode}")
                return 1
            
            # Calculate adjustment factors
            factors = integrator.get_seasonal_adjustment_factors(location['location_id'])
            
            # Print or save results
            result = {
                'location': location,
                'adjustment_factors': factors
            }
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"Adjustment factors saved to {args.output}")
            else:
                print(json.dumps(result, indent=2))
        
        return 0
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    finally:
        if 'integrator' in locals():
            integrator.close()

if __name__ == "__main__":
    sys.exit(main())
