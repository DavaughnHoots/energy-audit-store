import { pool } from '../config/database.js';

interface EnergyConsumptionData {
  powerConsumption: string;
  occupancyHours: {
    weekdays: string;
    weekends: string;
  };
  season: string;
  occupancyPattern: string;
  monthlyBill: number;
  peakUsageTimes: string[];
}

export class EnergyConsumptionService {
  async getUserEnergyData(userId: string): Promise<EnergyConsumptionData | null> {
    const query = `
      SELECT 
        power_consumption,
        weekday_occupancy_hours,
        weekend_occupancy_hours,
        season,
        occupancy_pattern,
        monthly_bill,
        peak_usage_times
      FROM user_energy_consumption
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const data = result.rows[0];
      return {
        powerConsumption: data.power_consumption,
        occupancyHours: {
          weekdays: data.weekday_occupancy_hours,
          weekends: data.weekend_occupancy_hours
        },
        season: data.season,
        occupancyPattern: data.occupancy_pattern,
        monthlyBill: data.monthly_bill,
        peakUsageTimes: data.peak_usage_times
      };
    } catch (error) {
      console.error('Error fetching user energy data:', error);
      throw error;
    }
  }

  async updateUserEnergyData(userId: string, data: EnergyConsumptionData): Promise<void> {
    const query = `
      INSERT INTO user_energy_consumption (
        user_id,
        power_consumption,
        weekday_occupancy_hours,
        weekend_occupancy_hours,
        season,
        occupancy_pattern,
        monthly_bill,
        peak_usage_times
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        power_consumption = EXCLUDED.power_consumption,
        weekday_occupancy_hours = EXCLUDED.weekday_occupancy_hours,
        weekend_occupancy_hours = EXCLUDED.weekend_occupancy_hours,
        season = EXCLUDED.season,
        occupancy_pattern = EXCLUDED.occupancy_pattern,
        monthly_bill = EXCLUDED.monthly_bill,
        peak_usage_times = EXCLUDED.peak_usage_times,
        updated_at = CURRENT_TIMESTAMP
    `;

    try {
      await pool.query(query, [
        userId,
        data.powerConsumption,
        data.occupancyHours.weekdays,
        data.occupancyHours.weekends,
        data.season,
        data.occupancyPattern,
        data.monthlyBill,
        data.peakUsageTimes
      ]);
    } catch (error) {
      console.error('Error updating user energy data:', error);
      throw error;
    }
  }
}
