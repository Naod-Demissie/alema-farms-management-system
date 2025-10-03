# Poultry Management System

A comprehensive web-based poultry farm management system built with Next.js, designed to streamline operations, track production, manage staff, and monitor the health and financial aspects of poultry farming operations.

## Features

### 🐔 **Flock Management**
- Track multiple flocks with detailed information
- Monitor flock health and performance metrics
- Manage flock lifecycle from chicks to mature birds

### 📊 **Production Tracking**
- Daily egg production recording
- Production analytics and reporting
- Performance metrics and trends

### 👥 **Staff Management**
- Employee registration and role management
- Attendance tracking
- Payroll management
- Leave request system

### 🌾 **Feed Management**
- Feed inventory tracking
- Feed program management
- Usage monitoring and alerts
- Supplier management

### 💰 **Financial Management**
- Income and expense tracking
- Financial reporting and analytics
- Budget management
- Cost analysis

### 🏥 **Health Management**
- Health record keeping
- Treatment tracking
- Mortality records
- Vaccination schedules

### 📈 **Analytics & Reporting**
- Comprehensive dashboard
- Performance metrics
- Financial reports
- Production analytics

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better Auth
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui
- **Email**: Nodemailer

## Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- MySQL database
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poultry-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   ```
   
   Edit `.env.local` and configure the following variables:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/poultry_db"
   NEXTAUTH_SECRET="your-secret-key"
   # Add other required environment variables
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push database schema
   npx prisma db push
   
   # Seed the database (optional)
   npm run seed-database
   ```

5. **Create an admin user**
   ```bash
   npm run create-admin
   ```

## How to Run

### Development Mode

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run start
   ```

## How to Test

Currently, this project uses ESLint for code quality checks:

```bash
npm run lint
```

To run any test files (if you have test files like `test_main.py`):

```bash
# For Python tests (if applicable)
pytest test_main.py

# For JavaScript/TypeScript tests (when implemented)
npm test
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run create-admin` - Create an admin user
- `npm run seed-feed` - Seed feed program data
- `npm run seed-database` - Seed the database with initial data

## Project Structure

```
poultry-system/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── features/              # Feature-specific components
├── lib/                   # Utility libraries and configurations
├── prisma/                # Database schema and migrations
├── server/                # Server-side logic
├── scripts/               # Database seeding and utility scripts
└── public/                # Static assets
```

## Key Features Usage

### Dashboard
Access the main dashboard at `/home` to view:
- Quick statistics
- Recent activities
- Key performance indicators

### Flock Management
Navigate to `/flocks` to:
- Add new flocks
- View flock details
- Track flock performance

### Production Tracking
Visit `/production` to:
- Record daily production
- View production trends
- Generate production reports

### Staff Management
Go to `/staff` to:
- Manage employee records
- Track attendance
- Handle payroll

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.