# VibeCheck

![CI/CD Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/master.yml/badge.svg)

A productivity tracking application that helps developers monitor their flow state and productivity levels throughout the day. Users can log their mood, tasks, and focus levels, with automatic calculation of daily productivity metrics.

**🔒 Authentication Required:** This application requires users to create an account and log in to access all features.

## Tech Stack

### Core Technologies

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Authentication, database, and row-level security
- [Shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components

### Testing Technologies

#### Unit & Component Testing

- [Vitest](https://vitest.dev/) - Fast unit test framework compatible with Vite/Astro ecosystem
- [React Testing Library](https://testing-library.com/react) - Testing React components with user-centric approach
- [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) - User interaction simulation in component tests
- [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking at the network level for testing edge cases

#### End-to-End Testing

- [Playwright](https://playwright.dev/) - E2E testing framework with multi-browser support

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Features

- **Productivity Tracking:** Log mood, tasks, and focus levels throughout the day
- **Daily Focus Score:** Automatic calculation based on mood ratings and entry frequency
- **Data Visualization:** Visual trends and patterns in your productivity
- **Filtering & Sorting:** Filter entries by date, mood, or tags
- **Secure & Private:** Row-level security ensures your data is only accessible to you
- **Authentication:** Email/password authentication with password recovery

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd 10xdevs-project
```

2. Install dependencies:

```bash
npm install
```

3. Set up local Supabase:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Start local Supabase instance
supabase start

# Get credentials
supabase status
```

4. Set up environment variables:

Create a `.env` file with your Supabase credentials:

```bash
# Copy from `supabase status` output
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Database migrations are automatically applied when starting Supabase

6. Run the development server:

```bash
npm run dev
```

7. Open your browser at `http://localhost:4321`

8. Build for production:

```bash
npm run build
```

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Testing

- `npm run test` - Run unit tests in watch mode
- `npm run test:unit` - Run unit tests once
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:ui` - Run unit tests with UI
- `npm run test:coverage` - Run unit tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:headed` - Run E2E tests in headed mode
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:all` - Run all tests (unit + E2E)

## Testing Strategy

VibeCheck uses a comprehensive testing approach to ensure code quality and reliability:

### Unit & Integration Tests (Vitest)

- **Business Logic:** Testing functions for focus score calculation, validators, and utilities
- **React Components:** Testing UI components with React Testing Library
- **API Integration:** Testing API communication with MSW (Mock Service Worker) for mocked responses
- Test coverage includes edge cases, error handling, and user interactions

### End-to-End Tests (Playwright)

- **User Journeys:** Complete authentication flows (signup, login, logout)
- **CRUD Operations:** Creating, reading, updating, and deleting productivity entries
- **Data Isolation:** Ensuring users can only access their own data (RLS verification)
- **Cross-browser:** Testing across multiple browsers for compatibility

Run tests with:

```bash
npm run test              # Unit & integration tests (watch mode)
npm run test:unit         # Unit tests (single run)
npm run test:e2e          # E2E tests
npm run test:all          # All tests
```

For detailed testing documentation, see [TESTING.md](./TESTING.md)

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages (routes)
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ │ └── ui/ # Shadcn/ui components
│ ├── db/ # Supabase clients and types
│ ├── lib/ # Services and utilities
│ │ ├── services/ # Business logic services
│ │ ├── utils/ # Helper functions
│ │ └── validators/# Validation functions
│ ├── hooks/ # React hooks
│ ├── middleware/ # Astro middleware (auth)
│ ├── types/ # TypeScript type definitions
│ └── assets/ # Static assets
├── public/ # Public assets
└── supabase/ # Supabase configuration
└── migrations/ # Database migrations
```

## CI/CD Pipeline

VibeCheck includes a comprehensive CI/CD pipeline that automatically runs on every push to `master` or can be triggered manually.

### Pipeline Steps

1. **TypeScript Check** - Validates type safety
2. **ESLint** - Checks code quality
3. **Unit Tests** - Runs Vitest tests
4. **E2E Tests** - Runs Playwright tests with local Supabase
5. **Production Build** - Validates production bundle

### Running Pipeline

**Automatically:** Push to `master` branch

```bash
git push origin master
```

**Manually:** Go to GitHub Actions tab and trigger workflow

For detailed CI/CD documentation, see [.github/README.md](./.github/README.md)

## Authentication

VibeCheck uses Supabase Authentication with email/password only. Key features:

- **Public Access:** Landing page (`/`) is accessible to all users
- **Protected Routes:** Dashboard and all features require authentication
- **Row Level Security:** Database policies ensure users can only access their own data
- **Password Recovery:** Users can reset their password via email
- **No OAuth:** External login providers (Google, GitHub, etc.) are not used

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
