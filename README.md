# Poultry Farm - Gestión Avícola

A comprehensive React Native/Expo mobile application for poultry farm management. Track batches, monitor feed consumption, record weights, manage mortality, handle sales and expenses, and view financial analytics.

## Features

- **Batch Management**: Create and track poultry batches with detailed information
- **Feed Tracking**: Log daily feed consumption with Purina feeding plan recommendations
- **Weight Monitoring**: Record bird weights and track growth over time
- **Mortality Logging**: Track mortality rates with cause categorization
- **Water Consumption**: Monitor daily water intake
- **Vaccination Records**: Keep track of vaccination schedules and history
- **Sales Management**: Record sales with pricing and buyer information
- **Expense Tracking**: Log farm expenses by category
- **Financial Dashboard**: View profit/loss, costs per bird, and financial analytics
- **Batch Comparison**: Compare performance across multiple batches
- **Multi-tenant Support**: Organization-based data isolation
- **Offline Support**: Data caching for offline access

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **State Management**: Zustand
- **Backend**: Supabase (Authentication + PostgreSQL)
- **Charts**: react-native-chart-kit
- **Language**: JavaScript/TypeScript
- **Testing**: Jest with jest-expo
- **CI/CD**: GitHub Actions
- **Build**: EAS Build

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) for builds
- iOS Simulator (Mac only) or Android Emulator
- Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/percys2/poultry-app.git
cd poultry-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project details:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the development server

```bash
npm start
```

This will open Expo DevTools. You can then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your device

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start web version |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run build:web` | Build web version |

## Project Structure

```
poultry-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── lib/
│   │   ├── supabase/       # Supabase client configuration
│   │   ├── sentry/         # Error tracking configuration
│   │   └── storage/        # Offline caching utilities
│   ├── modules/            # Feature modules
│   ├── navigation/         # Navigation configuration
│   ├── screens/
│   │   ├── auth/           # Login, Register, ForgotPassword
│   │   ├── batches/        # Batch management screens
│   │   ├── dashboard/      # Main dashboard
│   │   ├── finance/        # Financial analytics
│   │   ├── logs/           # Data entry screens
│   │   └── settings/       # App settings
│   ├── store/              # Zustand state management
│   ├── theme/              # Colors, spacing, typography
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, icons, fonts
├── .github/workflows/      # CI/CD pipelines
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest configuration
├── .eslintrc.js           # ESLint configuration
└── .prettierrc            # Prettier configuration
```

## Database Schema

The app uses Supabase with the following main tables:

- `organizations` - Multi-tenant organization data
- `profiles` - User profiles linked to organizations
- `farms` - Farm information
- `houses` - Poultry houses within farms
- `workers` - Farm workers
- `batches` - Poultry batches
- `feed_logs` - Daily feed consumption records
- `weight_logs` - Bird weight measurements
- `mortality_logs` - Mortality records
- `water_logs` - Water consumption records
- `vaccination_logs` - Vaccination records
- `expense_logs` - Farm expenses
- `sales_logs` - Sales records

## Building for Production

### Using EAS Build

1. Configure your EAS project:

```bash
eas build:configure
```

2. Update `app.json` with your EAS project ID

3. Build for different environments:

```bash
# Development build (with dev client)
eas build --profile development --platform all

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build (app store)
eas build --profile production --platform all
```

### Submitting to App Stores

```bash
# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

## Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

The project includes unit tests for utility functions covering:
- Date formatting and calculations
- Number formatting and currency
- Mathematical calculations (FCR, mortality rate, etc.)
- Weight conversions

## CI/CD

The project uses GitHub Actions for continuous integration:

- **ci.yml**: Runs on every push and PR
  - Linting with ESLint
  - Type checking with TypeScript
  - Unit tests with Jest
  - Security audit with npm audit
  - Web build verification

- **eas-build.yml**: Runs on main branch and version tags
  - Builds Android and iOS apps
  - Submits to app stores on version tags

## Error Tracking

The app is configured for Sentry error tracking. To enable:

1. Install Sentry: `npm install @sentry/react-native`
2. Add your DSN to `.env`: `EXPO_PUBLIC_SENTRY_DSN=your-dsn`
3. Uncomment the Sentry initialization in `src/lib/sentry/config.ts`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting and tests: `npm run lint && npm test`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

### Code Style

- Follow the existing code conventions
- Use TypeScript for new files when possible
- Run `npm run format` before committing
- Ensure all tests pass before submitting PR

## License

This project is private and proprietary.

## Support

For questions or issues, please open a GitHub issue or contact the development team.
