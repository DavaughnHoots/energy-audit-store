"use strict";
// Test script to verify duplex defaults functionality
Object.defineProperty(exports, "__esModule", { value: true });
var duplexDefaults_1 = require("./src/components/audit/forms/duplexDefaults");
// Test different duplex scenarios to verify defaults work as expected
function testDuplexDefaults() {
    console.log('\n=== TESTING DUPLEX DEFAULTS ===\n');
    // Test helper functions
    console.log('Testing helper functions:');
    console.log('- Construction Period for 1975: ' + (0, duplexDefaults_1.getDuplexConstructionPeriod)(1975));
    console.log('- Construction Period for 1990: ' + (0, duplexDefaults_1.getDuplexConstructionPeriod)(1990));
    console.log('- Construction Period for 2010: ' + (0, duplexDefaults_1.getDuplexConstructionPeriod)(2010));
    console.log('- Size Category for 1200 sq ft: ' + (0, duplexDefaults_1.getDuplexSizeCategory)(1200));
    console.log('- Size Category for 2000 sq ft: ' + (0, duplexDefaults_1.getDuplexSizeCategory)(2000));
    console.log('- Size Category for 2800 sq ft: ' + (0, duplexDefaults_1.getDuplexSizeCategory)(2800));
    console.log('- Unit Configuration (default): ' + (0, duplexDefaults_1.getDuplexUnitConfiguration)());
    console.log('- Unit Configuration (stacked): ' + (0, duplexDefaults_1.getDuplexUnitConfiguration)('stacked'));
    console.log('- Unit Configuration (front-to-back): ' + (0, duplexDefaults_1.getDuplexUnitConfiguration)('front-to-back'));
    // Test Case 1: Pre-1980 small duplex
    var preEightiesSmall = (0, duplexDefaults_1.getDuplexDefaults)(1970, 1000, 'NY', 'side-by-side');
    console.log('\nPre-1980 Small Side-by-side Duplex (NY State):');
    console.log('- Construction Period: pre-1980');
    console.log('- Size Category: small');
    console.log('- Configuration: side-by-side');
    console.log('- Est. Annual Usage: ' + preEightiesSmall.energyConsumption.estimatedAnnualUsage + ' MMBtu/yr');
    console.log('- Energy Intensity: ' + preEightiesSmall.energyConsumption.energyIntensity + ' kBtu/sq.ft');
    // Test Case 2: 1980-2000 medium duplex with stacked configuration
    var midEraStacked = (0, duplexDefaults_1.getDuplexDefaults)(1990, 1800, 'FL', 'stacked');
    console.log('\n1980-2000 Medium Stacked Duplex (FL State):');
    console.log('- Window Type: ' + midEraStacked.currentConditions.windowType);
    console.log('- Thermostat Type: ' + midEraStacked.heatingCooling.thermostatType);
    console.log('- Est. Annual Usage: ' + midEraStacked.energyConsumption.estimatedAnnualUsage + ' MMBtu/yr');
    console.log('- Energy Intensity: ' + midEraStacked.energyConsumption.energyIntensity + ' kBtu/sq.ft');
    // Test Case 3: Post-2000 large duplex front-to-back
    var newLargeFrontToBack = (0, duplexDefaults_1.getDuplexDefaults)(2010, 2800, 'AZ', 'front-to-back');
    console.log('\nPost-2000 Large Front-to-Back Duplex (AZ State):');
    console.log('- Insulation Quality: ' + newLargeFrontToBack.currentConditions.insulation.walls);
    console.log('- Air Leakage: ' + newLargeFrontToBack.currentConditions.estimatedACH + ' ACH');
    console.log('- Heating System Efficiency: ' + newLargeFrontToBack.heatingCooling.heatingSystem.efficiency);
    console.log('- Est. Annual Usage: ' + newLargeFrontToBack.energyConsumption.estimatedAnnualUsage + ' MMBtu/yr');
    // Test climate zone adjustments
    console.log('\n=== CLIMATE ZONE ADJUSTMENTS ===');
    var climateTest = [
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'MN', 'side-by-side'), // Cold
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'VA', 'side-by-side'), // Mixed-humid
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'FL', 'side-by-side'), // Hot-humid
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'AZ', 'side-by-side') // Hot-dry
    ];
    console.log('Same Duplex in Different Climate Zones:');
    console.log('- Cold/Very Cold (MN): ' + climateTest[0].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    console.log('- Mixed-Humid (VA): ' + climateTest[1].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    console.log('- Hot-Humid (FL): ' + climateTest[2].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    console.log('- Hot-Dry/Mixed-Dry (AZ): ' + climateTest[3].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    // Test unit configuration adjustments
    console.log('\n=== CONFIGURATION TYPE ADJUSTMENTS ===');
    var configTest = [
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'VA', 'side-by-side'),
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'VA', 'stacked'),
        (0, duplexDefaults_1.getDuplexDefaults)(2010, 1800, 'VA', 'front-to-back')
    ];
    console.log('Same Duplex with Different Configurations:');
    console.log('- Side-by-side: ' + configTest[0].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    console.log('- Stacked: ' + configTest[1].energyConsumption.estimatedAnnualUsage + ' MMBtu');
    console.log('- Front-to-back: ' + configTest[2].energyConsumption.estimatedAnnualUsage + ' MMBtu');
}
// Run the tests
testDuplexDefaults();
