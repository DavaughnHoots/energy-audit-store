# Energy Audit Store - User Manual

This comprehensive guide will walk you through the process of setting up the Energy Audit Store application and deploying it to Heroku. Follow these instructions carefully to ensure a successful setup and deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up the Frontend](#setting-up-the-frontend)
3. [Setting Up the Backend](#setting-up-the-backend)
4. [Deploying to Heroku](#deploying-to-heroku)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.x)
- **npm** (version 9.x)
- **Git** (latest version)
- **PostgreSQL** (version 14.x or later)
- **Heroku CLI** (for deployment)

### Installing Prerequisites

1. **Node.js and npm**: Download from [nodejs.org](https://nodejs.org/)
2. **Git**: Download from [git-scm.com](https://git-scm.com/)
3. **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/)
4. **Heroku CLI**: Install using npm:
   ```bash
   npm install -g heroku
   ```

## Setting Up the Frontend

Follow these steps to set up the frontend of the Energy Audit Store:

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/energy-audit-store.git
cd energy-audit-store
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```
VITE_API_URL=http://localhost:5000/api
```

> **Note**: If you're planning to use a different port for the backend, adjust the URL accordingly.

### Step 4: Verify Frontend Setup

Run the frontend development server to ensure everything is set up correctly:

```bash
npm run dev
```

The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

## Setting Up the Backend

### Step 1: Install Backend Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### Step 2: Configure Backend Environment Variables

Create a `.env` file in the backend directory with the following content:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=energy_efficient_store
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=development
```

> **Important**: Replace `your_password` with your PostgreSQL password and use a strong, unique value for `JWT_SECRET`.

### Step 3: Set Up the Database

1. Create a new PostgreSQL database:

```bash
psql -U postgres
```

Then in the PostgreSQL CLI:

```sql
CREATE DATABASE energy_efficient_store;
\c energy_efficient_store
```

2. Exit the PostgreSQL CLI:

```sql
\q
```

### Step 4: Run the Backend Server

Start the backend development server:

```bash
npm run dev
```

The backend server should now be running on `http://localhost:5000`.

## Deploying to Heroku

⚠️ **IMPORTANT** ⚠️

The deployment process must be done manually. Automated deployment scripts will not work correctly. Follow these steps precisely.

### Step 1: Prepare for Deployment

1. **Login to Heroku**:

```bash
heroku login
```

2. **Create a new Heroku app**:

```bash
heroku create your-app-name
```

3. **Add PostgreSQL addon**:

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 2: Configure Heroku Environment Variables

Set the necessary environment variables on Heroku:

```bash
heroku config:set JWT_SECRET=your_secure_jwt_secret
heroku config:set NODE_ENV=production
```

### Step 3: Prepare the Frontend for Deployment

1. **Fix Product Search Components**:

```bash
node scripts/fix_product_search_components.js
```

2. **Ensure TypeScript Builds Correctly**:

```bash
npm run build
```

If you encounter any TypeScript errors, fix them before proceeding.

### Step 4: Prepare the Backend for Deployment

1. Navigate to the backend directory:

```bash
cd backend
```

2. Build the backend:

```bash
npm run build:heroku
```

3. Return to the project root:

```bash
cd ..
```

### Step 5: Create a New Git Branch for Deployment

Always deploy from a new branch to avoid issues with the main branch:

```bash
git checkout -b deployment
```

### Step 6: Add and Commit Changes

```bash
git add .
git commit -m "Prepare for Heroku deployment"
```

### Step 7: Deploy to Heroku

```bash
git push heroku deployment:main
```

> **Note**: Replace `deployment` with your branch name if different.

### Step 8: Run Database Migrations

After deployment completes, run the database migrations:

```bash
heroku run "cd backend && node build/scripts/heroku_migration.js"
```

Optionally, run the energy consumption migration:

```bash
heroku run "cd backend && node build/scripts/run_energy_consumption_migration.js"
```

And the education migration if needed:

```bash
heroku run "cd backend && node build/scripts/run_education_migration.js"
```

### Step 9: Verify Deployment

Open your deployed application:

```bash
heroku open
```

## Troubleshooting

### Common Issues and Solutions

#### Build Fails with Path Resolution Errors

If you encounter errors related to component imports, such as:
```
Could not resolve "../components/products/SearchBar" from "src/pages/Products2Page.tsx"
```

Run the path fix script:
```bash
node scripts/fix_product_search_components.js
```

#### Database Migration Errors

If database migrations fail, check the Heroku logs:

```bash
heroku logs --tail
```

Look for specific error messages related to database connections or SQL syntax.

#### Deployment Issues

If deployment fails:

1. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

2. Verify that all dependencies are correctly installed:
   ```bash
   npm ci
   ```

3. Ensure your Heroku buildpacks are correctly set:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

### Getting Help

If you continue to experience issues:

1. Check the Heroku logs for specific error messages:
   ```bash
   heroku logs --tail
   ```

2. Refer to the project documentation in the `docs` directory.

3. Contact the development team for support.

## Maintenance and Updates

To update your deployed application:

1. Pull the latest changes from the repository.
2. Make any necessary configuration changes.
3. Follow the deployment steps again, ensuring you:
   - Create a new branch
   - Push to Git
   - Push to Heroku

⚠️ **REMEMBER**: Always follow the manual deployment process. Automated deployment scripts may cause issues.
