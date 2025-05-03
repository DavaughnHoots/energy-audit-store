# Energy Audit Store - Quick Setup Guide

This quick reference guide provides the essential steps for setting up and deploying the Energy Audit Store application. For detailed instructions, refer to the comprehensive [User Manual](./USER_MANUAL.md).

## Prerequisites Checklist

- [ ] Node.js (v18.x) and npm (v9.x)
- [ ] Git
- [ ] PostgreSQL (v14.x+)
- [ ] Heroku CLI

## Local Development Setup

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/your-username/energy-audit-store.git
cd energy-audit-store

# Install dependencies
npm install

# Create .env file in root directory
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file in backend directory
cat > .env << EOL
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=energy_efficient_store
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=development
EOL

# Create database
psql -U postgres -c "CREATE DATABASE energy_efficient_store;"

# Start backend server
npm run dev
```

## Heroku Deployment Checklist

⚠️ **IMPORTANT**: Follow these steps in exact order. DO NOT use automated deployment scripts.

1. **Heroku Setup**
   - [ ] `heroku login`
   - [ ] `heroku create your-app-name`
   - [ ] `heroku addons:create heroku-postgresql:hobby-dev`
   - [ ] `heroku config:set JWT_SECRET=your_secure_jwt_secret NODE_ENV=production`

2. **Frontend Preparation**
   - [ ] `node scripts/fix_product_search_components.js`
   - [ ] `npm run build`

3. **Backend Preparation**
   - [ ] `cd backend && npm run build:heroku && cd ..`

4. **Git Deployment**
   - [ ] `git checkout -b deployment`
   - [ ] `git add .`
   - [ ] `git commit -m "Prepare for Heroku deployment"`
   - [ ] `git push heroku deployment:main`

5. **Database Migrations**
   - [ ] `heroku run "cd backend && node build/scripts/heroku_migration.js"`
   - [ ] `heroku run "cd backend && node build/scripts/run_energy_consumption_migration.js"`
   - [ ] `heroku run "cd backend && node build/scripts/run_education_migration.js"`

6. **Verify Deployment**
   - [ ] `heroku open`

## Common Issues

- **Path Resolution Errors**: Run `node scripts/fix_product_search_components.js`
- **Database Connection Issues**: Check your PostgreSQL connection settings
- **Heroku Deployment Fails**: Run `heroku logs --tail` for detailed error messages

## Maintenance

Always deploy using the manual process:
1. Create a new branch
2. Push to Git
3. Push to Heroku

Never use automated deployment scripts as they will cause issues.
