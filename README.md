# Energy Efficient Store Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-18.x-green)](https://nodejs.org/)

A marketplace platform that helps homeowners find energy-efficient products, perform DIY energy audits, and monitor their energy savings. The platform combines **product recommendations** with **__personalized__** energy analysis to provide a seamless experience for improving home energy efficiency.

![Platform Preview](./src/assets/website%20logo.png)

## 🌟 Features

- **Smart Product Discovery**
  - Advanced search and filtering for energy-efficient products
  - Detailed product specifications and energy ratings
  - Price and savings comparisons

- **DIY Energy Audit Tools**
  - Step-by-step home energy assessment
  - Personalized efficiency recommendations
  - Energy savings calculator

- **User Dashboard**
  - Track energy savings progress
  - Manage property settings
  - View personalized recommendations

- **Community Features**
  - Share energy-saving success stories
  - Discussion forums
  - Energy-saving tips and guides

## 🚀 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- ShadCN UI components

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Winston for logging
- Zod for validation

## 📋 Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- npm 9.x or later
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/energy-audit-store.git
   cd energy-audit-store
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   psql -U postgres
   CREATE DATABASE energy_efficient_store;
   \c energy_efficient_store
   \i database_setup.sql
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

5. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=
   JWT_SECRET=your_secret_key
   ```

6. **Start development servers**

   Frontend (root directory):
   ```bash
   npm run dev
   ```

   Backend (backend directory):
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── backend/                # Backend Express application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── types/            # TypeScript types
└── public/               # Static assets
```

## 🔨 Available Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend

```bash
npm run dev          # Start development server
npm start           # Start production server
npm run build       # Build TypeScript files
npm test            # Run tests
```

## 🧪 Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

## 🚀 Deploying to Heroku

The application is optimized for deployment to Heroku with the following features:

1. **Production Mode**
   - The `Procfile` sets `NODE_ENV=production` to enable production optimizations
   - The build script automatically removes development dependencies and test files in production

2. **Optimized Build Process**
   - Development files are excluded from the production build
   - Test files and documentation are not included in the deployed application
   - Only necessary scripts are included in the production build

3. **Deployment Steps**

   a. **Install the Heroku CLI**
   ```bash
   npm install -g heroku
   ```

   b. **Login to Heroku**
   ```bash
   heroku login
   ```

   c. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

   d. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

   e. **Configure environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret_key
   heroku config:set NODE_ENV=production
   ```

   f. **Deploy the application**
   ```bash
   git push heroku main
   ```

   g. **Run database migrations**
   ```bash
   heroku run bash
   cd backend
   node build/scripts/heroku_migration.js
   ```

4. **Monitoring and Scaling**
   - Use Heroku Dashboard to monitor application performance
   - Scale dynos as needed based on traffic
   - Monitor PostgreSQL connection limits and upgrade plan if necessary

5. **Troubleshooting**
   - Check logs with `heroku logs --tail`
   - Restart the application with `heroku restart`
   - Verify environment variables with `heroku config`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📚 API Documentation

API documentation is available at `/api-docs` when running the development server. Please take a look at our [API Documentation](./backend/README.md) for detailed API specifications.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Express](https://expressjs.com/)

## 📧 Contact

Project Link: [https://github.com/DavaughnHoots/energy-audit-store](https://github.com/DavaughnHoots/energy-audit-store)
