# Daily Usage Hours Population Fix

## Problem Statement
In reports, the "Daily Usage Hours" field displays "0.0 hours/day" instead of populated values based on the user's selected occupancy pattern. Currently, when a user selects an occupancy pattern (Home All Day, Away During Work Hours, etc.), the system updates related fields like electric bills, gas bills, and occupancy hours for weekday/weekend, but not the `durationHours` field that's displayed in reports.

## Root Cause
The `occupancyPatternDefaults` object in `energyDefaults.ts` doesn't include default values for the `durationHours` field. While the occupancy patterns have detailed breakdowns for weekday and weekend hours, there's no direct mapping to the single daily usage hours value needed for the reports.

## Solution Approach
1. **Extend the `occupancyPatternDefaults` object** in `energyDefaults.ts` to include appropriate `durationHours` values for each occupancy pattern:
   - Home All Day: ~20.0 hours (nearly full day at home)
   - Away During Work Hours: ~14.0 hours (evenings + night)
   - Evenings and Weekends Only: ~10.0 hours (limited evening hours on weekdays + weekend time)
   - Variable Schedule: ~12.0 hours (midpoint value)

2. **Update the form handling** in `EnergyUseForm.tsx` to ensure the `durationHours` field gets updated when the occupancy pattern changes, along with the other fields.

## Implementation Steps
1. Modify `src/components/audit/forms/energyDefaults.ts` to add the `durationHours` property to each occupancy pattern.
2. Confirm that in `EnergyUseForm.tsx`, the `handleBasicFieldChange` function correctly handles updating the `durationHours` field when the occupancy pattern changes.
3. Test the changes by selecting different occupancy patterns in the form and verifying that the Daily Usage Hours field displays the correct value in reports.

## Expected Outcome
After implementing these changes, the "Daily Usage Hours" field in reports should display an appropriate value based on the selected occupancy pattern, rather than showing "0.0 hours/day".
