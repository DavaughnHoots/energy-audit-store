# Energy Efficient Store Market Platform

An energy-efficient product marketplace platform built with React, TypeScript, and Vite.

## Prerequisites

Ensure you have the following installed:

- **Node.js** 18.x or later ([Download Node.js](https://nodejs.org/))
- **npm** 9.x or later (comes with Node.js)
- **Git** ([Download Git](https://git-scm.com/))

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd energy-audit-store
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

<<<<<<< HEAD
3. Required packages:
```bash
npm install @radix-ui/react-alert-dialog class-variance-authority clsx lucide-react tailwind-merge react-router-dom node pg bcrypt jsonwebtoken uuid express express-session cors cookie helmet nodemailer handlebars express-rate-limit zod @types/node @types/pg @types/bcrypt @types/jsonwebtoken @types/uuid @types/express @types/express-session @types/cors @types/cookie-parser @types/helmet @types/nodemailer @types/handlebars @types/express-rate-limit
```
=======
3. **Install required packages:**
   ```bash
   npm install @radix-ui/react-alert-dialog class-variance-authority clsx lucide-react tailwind-merge react-router-dom @types/node class-validator class-transformer papaparse @types/papaparse
   ```
>>>>>>> 7cc95b7cb20004e4f477c107acbee27316084868

4. **Install dev dependencies:**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

5. **Initialize Tailwind CSS:**
   ```bash
   npx tailwindcss init -p
   ```

6. **Set up `.env` file:**
   - Create a `.env` file in the root directory.
   - Add the following environment variables (update values as needed):
     ```
     VITE_API_URL=http://localhost:3000/api
     ```

## Development

1. **Start the development server:**
   ```
   npm run dev
   ```

2. **Access the application:**
   - Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Check for any linting errors:**
   ```
   npm run lint
   ```

## Build & Deployment

1. **Build the project for production:**
   ```
   npm run build
   ```

2. **Preview the production build:**
   ```
   npm run preview
   ```

3. Ensure the `dist/` folder is ready for deployment.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Basic UI components
│   └── layout/        # Layout components
├── pages/             # Page components
├── services/          # API services
├── types/             # TypeScript types
└── lib/               # Utilities
```

## Git Workflow

1. **Create a feature branch:**
   ```
   git checkout -b feature/[feature-name]
   ```

2. **Commit your changes:**
   ```
   git add .
   git commit -m "feat: [short description of changes]"
   ```

3. **Push your branch to the repository:**
   ```
   git push origin feature/[feature-name]
   ```

4. **Create a pull request** and request a review.

## Troubleshooting

1. **CORS Issues:**
   - Verify the API URL in `.env`.
   - Ensure the backend server allows requests from the front-end origin.

2. **Style Issues:**
   - Check the Tailwind CSS configuration (`tailwind.config.js`).

3. **TypeScript Errors:**
   - Verify your imports.
   - Ensure all TypeScript types are properly defined and imported.

4. **Development Server Fails to Start:**
   - Clear `node_modules` and reinstall dependencies:
     ```
     rm -rf node_modules
     npm install
     ```

## Available Commands

Here’s a list of available commands for managing the project:

- **Start development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`
- **Run ESLint:** `npm run lint`

## Team Conventions

1. **Coding Standards:**
   - Use TypeScript for all new files.
   - Follow the component structure and patterns in `src/components/`.

2. **Documentation:**
   - Include JSDoc comments for all utility functions and services.
   - Update the README if you add new features or commands.

3. **Testing:**
   - Write and verify tests for new features.

4. **Commit Messages:**
   - Follow this convention: `feat: [short description]`.

5. **Pull Requests:**
   - Ensure all tests pass before creating a pull request.

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide)
