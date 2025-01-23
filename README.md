# Energy Efficient Store Market Platform

Energy-efficient product marketplace platform built with React, TypeScript, and Vite.

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

## Setup Instructions

1. Clone repository:
```bash
git clone [repository-url]
cd energy-audit-store
```

2. Install dependencies:
```bash
npm install
```

3. Required packages:
```bash
npm install @radix-ui/react-alert-dialog class-variance-authority clsx lucide-react tailwind-merge react-router-dom node pg bcrypt jsonwebtoken uuid express express-session cors cookie helmet nodemailer handlebars @types/node @types/pg @types/bcrypt @types/jsonwebtoken @types/uuid @types/express @types/express-session @types/cors @types/cookie-parser @types/helmet @types/nodemailer @types/handlebars
```

4. Install dev dependencies:
```bash
npm install -D tailwindcss postcss autoprefixer
```

5. Initialize Tailwind:
```bash
npx tailwindcss init -p
```

## Development

Start development server:
```bash
npm run dev
```

Access the application at: http://localhost:5173

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Basic UI components
│   └── layout/        # Layout components
├── pages/             # Page components
├── services/          # API services
├── types/             # TypeScript types
└── lib/              # Utilities
```

## Git Workflow

1. Create feature branch:
```bash
git checkout -b feature/[feature-name]
```

2. Commit changes:
```bash
git add .
git commit -m "feat: description"
```

3. Push changes:
```bash
git push origin feature/[feature-name]
```

## Common Issues

- If facing CORS issues, ensure the API endpoint is correct in `.env`
- For style issues, check Tailwind configuration
- For TypeScript errors, verify imports and type definitions

## Team Conventions

- Use TypeScript for all new files
- Follow existing component patterns
- Include component documentation
- Write clear commit messages

## Available Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

## Contributing

1. Follow Git workflow
2. Ensure tests pass
3. Update documentation
4. Create pull request

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide)
