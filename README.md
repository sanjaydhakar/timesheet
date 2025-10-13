# Resource Management Tool

A comprehensive full-stack web application for managing developer resources, project allocations, and team planning with persistent database storage.

## Features

### Core Functionality
- **Resource View**: Developer-centric view showing individual timelines, project assignments, bandwidth allocation, and availability
- **Project View**: Project-centric view displaying all developers assigned to each project, completion timelines, and resource allocation
- **Enhanced Timeline View**: 
  - Visual Gantt-chart style display with color-coded projects and bandwidth indicators
  - **Drag-to-Add**: Click and drag on any row to quickly create allocations (like Google Calendar)
  - **Pivot Views**: Toggle between "By Developer" and "By Project" views
  - Interactive tooltips and real-time updates
- **Many-to-Many Mapping**: Flexible allocation system allowing developers to work on multiple projects simultaneously
- **Bandwidth Tracking**: Simple half-time (50%) or full-time (100%) allocation per project
- **Timeline Management**: Track start/end dates for all initiatives with visibility into current and future availability

### Planning & Communication
- **ETA Tracking**: View estimated completion dates for all active projects
- **Availability Finder**: Intelligent search to identify available developers based on required bandwidth and skills
- **Resource Planning**: Plan new projects by finding the earliest available developers with matching skill sets
- **Team Management**: Easy addition/removal of developers and projects

### Advanced Features
- **Skill-Based Matching**: Tag developers with platform expertise (React, Backend, Homepage, etc.)
- **Smart Filtering**: Filter available resources by specific skill sets
- **Intelligent Suggestions**: Get optimal resource allocation recommendations based on project requirements and developer expertise
- **Priority Management**: Mark projects as Low, Medium, High, or Critical priority
- **Status Tracking**: Track project status (Planning, Active, On Hold, Completed)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Modern styling
- **Lucide React** - Beautiful icons
- **date-fns** - Date manipulation

### Backend
- **Node.js** with Express
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **express-validator** - Input validation
- **CORS** enabled for frontend communication

## Getting Started

### Quick Start

See [SETUP.md](SETUP.md) for detailed installation instructions.

**TL;DR:**
```bash
# 1. Install PostgreSQL and create database
createdb resource_management

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# 4. Run migrations and seed data
cd server
npm run build
npm run db:migrate
npm run db:seed

# 5. Start servers (in separate terminals)
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

Open http://localhost:5173 in your browser!

### Development Mode

Run both backend and frontend:

**Backend (Terminal 1):**
```bash
cd server
npm run dev
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

### Building for Production

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
npm run build
npm run preview
```

## Project Structure

```
timesheet-cursor/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── ResourceView.tsx      # Developer-centric view
│   │   ├── ProjectView.tsx       # Project-centric view
│   │   ├── TimelineViewEnhanced.tsx # Enhanced Gantt chart with drag-to-add & pivot views
│   │   ├── TimelineView.tsx      # Legacy timeline view
│   │   ├── AvailabilityFinder.tsx # Resource search
│   │   ├── ManageData.tsx        # CRUD operations
│   │   ├── BulkAddDevelopers.tsx # Bulk import component
│   │   ├── LoadingState.tsx      # Loading indicator
│   │   └── ErrorState.tsx        # Error display
│   ├── contexts/
│   │   └── DataContext.tsx       # State management + API integration
│   ├── services/
│   │   └── api.ts                # API client functions
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── calculations.ts       # Business logic
│   │   └── dateUtils.ts          # Date helpers
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── server/                       # Backend source
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── developers.ts     # Developer endpoints
│   │   │   ├── projects.ts       # Project endpoints
│   │   │   └── allocations.ts    # Allocation endpoints
│   │   ├── config/
│   │   │   └── database.ts       # PostgreSQL connection
│   │   ├── database/
│   │   │   ├── schema.sql        # Database schema
│   │   │   ├── migrate.ts        # Migration script
│   │   │   └── seed.ts           # Seed data script
│   │   └── server.ts             # Express server
│   ├── package.json
│   └── tsconfig.json
├── SETUP.md                      # Detailed setup guide
├── README.md                     # This file
└── package.json
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

**Developers:**
- `GET /developers` - Get all developers
- `POST /developers` - Create developer
- `PUT /developers/:id` - Update developer
- `DELETE /developers/:id` - Delete developer

**Projects:**
- `GET /projects` - Get all projects
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

**Allocations:**
- `GET /allocations` - Get all allocations
- `POST /allocations` - Create allocation
- `PUT /allocations/:id` - Update allocation
- `DELETE /allocations/:id` - Delete allocation

See [SETUP.md](SETUP.md) for complete API documentation.

## Usage Guide

### Resource View
- View all developers with their current allocations
- See bandwidth usage (color-coded: green = available, yellow/orange = partially allocated, red = fully allocated)
- Check availability windows and next available dates
- Filter developers by name, email, or skills

### Project View
- Browse all projects with their status and priority
- See which developers are assigned to each project
- View estimated completion dates
- Filter by status or priority level

### Enhanced Timeline View
- **Two View Modes**:
  - **By Developer**: Rows are developers, bars show project allocations (default)
  - **By Project**: Rows are projects, bars show developer assignments
- **Drag-to-Add Allocations**:
  - Click and drag across any row to select a time range
  - Automatically opens a quick-add form with dates pre-filled
  - Works like adding events in Google Calendar
  - Pre-selects the developer or project based on the row
- **Visual Features**:
  - Color-coded project bars with bandwidth percentages
  - Switch between 3, 6, or 12-month views
  - Navigate backward/forward or jump to today
  - Hover over bars for detailed allocation information
  - Red line indicator showing current date
  - See overlapping allocations and availability at a glance
- **Smart Sorting**: Developers/projects sorted by utilization (busiest first)

### Find Resources
- Specify required bandwidth (50% or 100%)
- Select required skills
- Get a ranked list of available developers based on:
  - Skill match percentage
  - Availability date
  - Available bandwidth

### Manage Data
Three management tabs:
1. **Developers**: Add/edit/delete developers and their skills
   - **Bulk Import**: Import multiple developers at once via CSV or JSON
   - Download templates for easy formatting
   - Automatic validation and duplicate checking
   - Detailed success/failure reporting
2. **Projects**: Manage project details, priorities, and required skills
3. **Allocations**: Create and manage developer-to-project assignments with bandwidth and date ranges

## Database Schema

### Developers
- Stores developer information with skills array
- Unique email constraint
- Cascade delete for allocations

### Projects
- Project details with priority and status
- Array of required skills
- Cascade delete for allocations

### Allocations
- Many-to-many relationship between developers and projects
- Bandwidth: 50% or 100% only
- Date range validation
- Notes field for additional context

## Use Cases

1. **New Project Planning**: Use the availability finder to identify which developers can start on a new project
2. **Capacity Planning**: Check resource view to see who has bandwidth for additional work
3. **Skill Matching**: Find developers with specific expertise for specialized tasks
4. **Timeline Estimation**: Use project view to understand when current initiatives will complete
5. **Team Rebalancing**: Identify overallocated developers and redistribute work
6. **Visual Timeline**: See all allocations at a glance with the enhanced Gantt-chart view
7. **Quick Allocation**: Drag-to-add allocations directly on the timeline for fast data entry
8. **Pivot Analysis**: Toggle between developer-view and project-view to analyze from different perspectives
9. **Bulk Onboarding**: Import entire teams at once using CSV or JSON format

## Bulk Import Developers

The bulk import feature allows you to add multiple developers at once:

### CSV Format
```csv
name,email,skills
John Doe,john@example.com,"React,TypeScript,Node.js"
Jane Smith,jane@example.com,"Python,Django,PostgreSQL"
```

### JSON Format
```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["React", "TypeScript", "Node.js"]
  },
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "skills": ["Python", "Django", "PostgreSQL"]
  }
]
```

### How to Use
1. Go to **Manage Data** → **Developers** tab
2. Click **Bulk Import** button
3. Choose CSV or JSON format
4. Download a template (optional)
5. Upload a file or paste data
6. Click **Import Developers**
7. Review results - see which succeeded/failed

Sample files are available in the `examples/` directory.

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check database credentials in `server/.env`
- Verify port 3001 is available

### Frontend shows connection error
- Ensure backend server is running
- Check `VITE_API_URL` in `.env`
- Verify CORS is enabled

### Database errors
- Run migrations: `cd server && npm run db:migrate`
- Check PostgreSQL logs
- Verify user permissions

See [SETUP.md](SETUP.md) for detailed troubleshooting.

## Future Enhancements

- User authentication and authorization
- Export data to CSV/Excel
- Calendar integrations (Google Calendar, Outlook)
- Email notifications for allocation changes
- Advanced analytics and reporting
- Mobile app
- Real-time collaboration

## License

MIT
