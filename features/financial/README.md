# Financial Management System

A comprehensive financial management system for poultry farm operations, providing expense tracking, revenue management, and detailed financial reporting.

## Features

### 1. Expense Tracking
- **Categorized Expenses**: Track expenses across 6 categories:
  - Feed
  - Medicine
  - Labor
  - Utilities
  - Maintenance
  - Other
- **Per-Flock Tracking**: Associate expenses with specific flocks
- **Date-based Filtering**: Filter expenses by date ranges
- **Real-time Analytics**: Live expense summaries and category breakdowns
- **CRUD Operations**: Create, read, update, and delete expense records

### 2. Revenue Management
- **Multiple Revenue Sources**: Track revenue from 4 sources:
  - Egg Sales
  - Bird Sales
  - Subsidy
  - Other
- **Per-Flock Tracking**: Associate revenue with specific flocks
- **Date-based Filtering**: Filter revenue by date ranges
- **Real-time Analytics**: Live revenue summaries and source breakdowns
- **CRUD Operations**: Create, read, update, and delete revenue records

### 3. Financial Reporting
- **Per-Flock Analysis**: Detailed financial performance for each flock
- **Monthly Trends**: Revenue, expenses, and profit trends over time
- **Summary Charts**: Visual representation of financial data
- **Export Functionality**: Export reports in CSV format (PDF coming soon)
- **Custom Date Ranges**: Generate reports for specific time periods

### 4. Financial Analytics
- **Key Performance Indicators**: Total revenue, expenses, net profit, profit margin
- **Performance Insights**: Best/worst performing months, average monthly profit
- **Financial Health Assessment**: Profitability status and margin health
- **Trend Analysis**: Visual trends and performance indicators
- **Category Breakdowns**: Detailed analysis of expense and revenue categories

## Technical Architecture

### Database Schema
The financial system uses the existing Prisma schema with the following models:
- `Expenses`: Stores expense records with categories
- `Revenue`: Stores revenue records with sources
- Both models are linked to `Flocks` for per-flock tracking

### API Endpoints
- `GET/POST /api/financial/expenses` - Expense management
- `PUT/DELETE /api/financial/expenses/[id]` - Individual expense operations
- `GET/POST /api/financial/revenue` - Revenue management
- `PUT/DELETE /api/financial/revenue/[id]` - Individual revenue operations
- `GET /api/financial/reports/flocks` - Per-flock financial summaries
- `GET /api/financial/reports/monthly` - Monthly financial data
- `GET /api/financial/analytics` - Financial analytics data
- `GET /api/financial/reports/export` - Export functionality

### Components Structure
```
app/(dashboard)/financial/
├── page.tsx                    # Main financial management page
└── components/
    ├── expense-tracking.tsx    # Expense management component
    ├── revenue-management.tsx  # Revenue management component
    ├── financial-reporting.tsx # Reporting and analytics
    └── financial-analytics.tsx # Advanced analytics dashboard
```

### Server Functions
```
server/financial.ts
├── createExpense()            # Create new expense
├── updateExpense()            # Update existing expense
├── deleteExpense()            # Delete expense
├── getExpenses()              # Fetch expenses with filters
├── createRevenue()            # Create new revenue
├── updateRevenue()            # Update existing revenue
├── deleteRevenue()            # Delete revenue
├── getRevenue()               # Fetch revenue with filters
├── getFinancialSummary()      # Overall financial summary
├── getExpenseSummary()        # Expense category breakdown
├── getRevenueSummary()        # Revenue source breakdown
├── getFlockFinancialSummaries() # Per-flock financial data
├── getMonthlyFinancialData()  # Monthly trend data
└── getFinancialAnalytics()    # Comprehensive analytics
```

## Usage

### Adding Expenses
1. Navigate to Financial Management → Expense Tracking
2. Click "Add Expense"
3. Select flock, category, amount, date, and optional description
4. Save the expense

### Adding Revenue
1. Navigate to Financial Management → Revenue Management
2. Click "Add Revenue"
3. Select flock, source, amount, date, and optional description
4. Save the revenue record

### Viewing Reports
1. Navigate to Financial Management → Financial Reporting
2. Select date range and optional flock filter
3. View per-flock analysis, monthly trends, or summary charts
4. Export data using the export buttons

### Analytics Dashboard
1. Navigate to Financial Management → Analytics
2. View key performance indicators
3. Analyze expense and revenue breakdowns
4. Review financial health and trends

## Data Types

### ExpenseCategory
```typescript
enum ExpenseCategory {
  feed = "feed",
  medicine = "medicine",
  labor = "labor",
  utilities = "utilities",
  maintenance = "maintenance",
  other = "other"
}
```

### RevenueSource
```typescript
enum RevenueSource {
  egg_sales = "egg_sales",
  bird_sales = "bird_sales",
  subsidy = "subsidy",
  other = "other"
}
```

### FinancialSummary
```typescript
interface FinancialSummary {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}
```

## Future Enhancements

- PDF export functionality
- Advanced chart visualizations
- Budget planning and forecasting
- Cost per bird/egg calculations
- Integration with accounting systems
- Automated expense categorization
- Mobile app support
- Real-time notifications for budget alerts

## Security

- All financial data is protected by authentication
- Role-based access control (Admin only for financial management)
- Input validation and sanitization
- Secure API endpoints with proper error handling
