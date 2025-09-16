# Home Page Components

This directory contains all the components that make up the comprehensive home page dashboard for the poultry management system.

## Components Overview

### 1. Main Home Page (`/app/(dashboard)/page.tsx`)
The main dashboard page that brings together all components to provide a comprehensive overview and quick access to all system features.

**Features:**
- Key metrics dashboard with real-time stats
- Quick action cards for all major features
- Recent activity feed with filtering
- Alert notifications
- Quick search functionality
- Responsive design

### 2. Quick Action Dialog (`quick-action-dialog.tsx`)
Modal dialogs for quick actions that don't require full page navigation.

**Supported Actions:**
- Add New Flock
- Record Egg Production
- Add Expense
- Add Staff Member

**Features:**
- Form validation
- Loading states
- Responsive design
- Easy to extend for new actions

### 3. Activity Feed (`activity-feed.tsx`)
Interactive activity feed component with filtering and search capabilities.

**Features:**
- Real-time activity updates
- Filter by activity type
- Search functionality
- Status indicators
- Responsive design
- Refresh capability

### 4. Quick Stats (`quick-stats.tsx`)
Reusable stats cards component with trend indicators and status colors.

**Features:**
- Configurable stat cards
- Trend indicators (up/down/neutral)
- Status colors (good/warning/danger/info)
- Responsive grid layout
- Predefined configurations for common stats

### 5. Quick Search (`quick-search.tsx`)
Advanced search component with recent searches and categorized results.

**Features:**
- Real-time search across all features
- Recent searches with localStorage persistence
- Categorized results
- Type indicators (action/page/feature)
- Keyboard navigation
- Quick access to all system features

## Quick Actions Available

### Flock Management
- **Add New Flock**: Register a new flock batch
- **View All Flocks**: Manage existing flocks
- **Population Tracking**: Track flock population changes
- **Flock Analytics**: View flock performance metrics

### Health & Veterinary
- **Record Vaccination**: Log vaccination details
- **Add Treatment**: Record medical treatments
- **Health Monitoring**: Monitor flock health status
- **Mortality Record**: Record bird deaths

### Production Management
- **Record Egg Production**: Log daily egg production
- **Production Analytics**: View production insights
- **Quality Assessment**: Assess egg quality grades
- **Production Reports**: Generate production reports

### Feed Management
- **Add Feed Inventory**: Update feed stock levels
- **Record Feed Usage**: Log daily feed consumption
- **Manage Suppliers**: Update supplier information
- **Feed Analytics**: Analyze feed costs and usage

### Financial Management
- **Add Expense**: Record farm expenses
- **Record Revenue**: Log income from sales
- **Financial Reports**: Generate financial reports
- **Budget Overview**: View budget and forecasts

### Staff Management
- **Add Staff Member**: Register new staff member
- **Check Attendance**: View staff attendance records
- **Process Payroll**: Manage staff payroll
- **Leave Requests**: Manage staff leave requests

### Reports & Analytics
- **Comprehensive Reports**: Generate all system reports
- **Export Data**: Export data to CSV/PDF
- **System Analytics**: View system-wide analytics
- **Custom Reports**: Create custom reports

## Usage

### Basic Implementation
```tsx
import { HomePage } from "@/app/(dashboard)/page";

export default function Dashboard() {
  return <HomePage />;
}
```

### Custom Stats
```tsx
import { QuickStats, createStatCards } from "@/components/home/quick-stats";

const customStats = createStatCards({
  totalFlocks: 15,
  activeStaff: 30,
  todayProduction: 2000,
  monthlyRevenue: 60000
});

<QuickStats stats={customStats} />
```

### Activity Feed
```tsx
import { ActivityFeed } from "@/components/home/activity-feed";

const activities = [
  { id: 1, action: "New flock added", time: "2 minutes ago", type: "flock", status: "success" }
];

<ActivityFeed 
  activities={activities}
  onRefresh={() => refreshData()}
  onViewAll={() => router.push('/reports')}
/>
```

### Quick Search
```tsx
import { QuickSearch } from "@/components/home/quick-search";

<QuickSearch 
  onResultSelect={(result) => {
    console.log('Selected:', result);
  }}
/>
```

## Customization

### Adding New Quick Actions
1. Add the action to the `quickActions` array in the main page
2. If it needs a dialog, add the form logic to `quick-action-dialog.tsx`
3. Update the search results in `quick-search.tsx`

### Customizing Stats
1. Modify the `createStatCards` or `createAlertCards` functions
2. Add new stat configurations as needed
3. Update the mock data in the main page

### Styling
All components use Tailwind CSS classes and can be customized by:
- Modifying the className props
- Updating the color schemes in the component files
- Adding custom CSS classes

## Data Integration

The components are designed to work with real data. Replace the mock data with actual API calls:

```tsx
// Example: Replace mock stats with real data
const [stats, setStats] = useState(null);

useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/dashboard/stats');
    const data = await response.json();
    setStats(data);
  };
  fetchStats();
}, []);

// Use real data
<QuickStats stats={createStatCards(stats)} />
```

## Performance Considerations

- Components use React.memo where appropriate
- Search is debounced to prevent excessive API calls
- Recent searches are cached in localStorage
- Images and icons are optimized
- Lazy loading for heavy components

## Accessibility

- All components are keyboard navigable
- Proper ARIA labels and roles
- Screen reader friendly
- High contrast support
- Focus management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interfaces
- Progressive enhancement
