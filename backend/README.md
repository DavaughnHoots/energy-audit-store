# Energy Audit Backend

This is the backend server for the Energy Audit application. It provides APIs for energy audit data collection, analysis, and product recommendations.

## Features

- Energy audit data collection and storage
- Energy efficiency calculations and analysis
- Product recommendations based on audit data
- PDF report generation
- User authentication and authorization
- Data caching for improved performance

## Getting Started

### Prerequisites

- Node.js 18.x
- npm 9.x
- PostgreSQL database

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies

```bash
npm install
```

4. Create a `.env` file based on `.env.example` and configure your environment variables
5. Run database migrations

```bash
npm run migrate
```

### Running the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## API Documentation

The API provides endpoints for:

- User authentication
- Energy audit data management
- Product recommendations
- Report generation

For detailed API documentation, see the [API Documentation](./docs/api.md).

## Testing

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Product Recommendations Tests

To test the product recommendations functionality:

```bash
npm run test:recommendations
```

This tests:
1. The product recommendations endpoint
2. The energy audit endpoint with product recommendations
3. Caching functionality for product recommendations

For more details, see the [Product Recommendations Tests README](./src/tests/README.md).

## Scripts

- `npm run dev` - Start the development server with hot reloading
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:recommendations` - Run product recommendations tests
- `npm run import-products-full` - Import the full product database
- `npm run associate-audits` - Associate orphaned audits with users

## Project Structure

- `src/` - Source code
  - `config/` - Configuration files
  - `middleware/` - Express middleware
  - `migrations/` - Database migrations
  - `routes/` - API routes
  - `services/` - Business logic
  - `tests/` - Test files
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
  - `validators/` - Input validation
  - `server.ts` - Server entry point

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is proprietary and confidential.
