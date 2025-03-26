# Energy Audit Store Enhancements Testing Guide

This guide explains how to test the energy audit enhancements implemented for the Energy Audit Store application.

## Enhancement Components

1. **Daily Usage Hours Validation**
   - Validates energy consumption usage hours
   - Provides intelligent defaults based on occupancy patterns
   - Located in `backend/src/utils/usageHoursValidator.ts`

2. **HVAC Metrics Context Explanation**
   - Provides clear explanations of HVAC efficiency metrics
   - Shows regional standards and recommendations
   - Located in `backend/src/services/hvacMetricsExplanationService.ts`

3. **Interactive Report HVAC Component**
   - Displays HVAC information with context-sensitive help
   - Located in `src/components/reports/ReportHvac.tsx`

## Running Tests

### Option 1: Run All Tests

To run all enhancement tests at once:

```bash
run-enhancement-tests.bat
```

This will:
1. Compile the TypeScript files with `tsc`
2. Run all test scripts with ES Module support
3. Display test results in the console

### Option 2: Run Individual Tests

To run a specific test:

```bash
run-es-module-tests.bat test-usage-hours-validator.js
```

or

```bash
run-es-module-tests.bat test-hvac-metrics-explanation.js
```

## Module Compatibility

Our enhancement test scripts use ES Modules format, following the backend's module system. For more details on module compatibility, see [Module Compatibility Guide](./module-compatibility-guide.md).

## Deployment

After testing, you can deploy the enhancements:

```bash
deploy-energy-audit-enhancements.bat
```

This will:
1. Compile TypeScript files
2. Run all tests to verify functionality
3. Create backup files
4. Prepare deployment files
5. Guide you through production deployment steps

## Common Issues

### TypeScript Compilation Errors

You may see TypeScript errors during compilation from files unrelated to the enhancements. These errors are from other parts of the codebase and don't affect our enhancement functionality.

### Module Import Errors

If you see errors like `ERR_REQUIRE_ESM`, make sure you're running the tests with the correct Node.js flags. Our test runner scripts handle this automatically.
