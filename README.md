# Resource Management Tool

A comprehensive web application for managing developer resources, project allocations, and team planning.

## Features

### Core Functionality
- **Resource View**: Developer-centric view showing individual timelines, project assignments, bandwidth allocation, and availability
- **Project View**: Project-centric view displaying all developers assigned to each project, completion timelines, and resource allocation
- **Timeline View**: Visual Gantt-chart style display showing all allocations across time with color-coded projects, bandwidth indicators, and interactive tooltips
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

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

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

### Timeline View
- Visual Gantt-chart showing all developer allocations over time
- Color-coded project bars with bandwidth percentages
- Switch between 3, 6, or 12-month views
- Navigate backward/forward or jump to today
- Hover over bars for detailed allocation information
- Red line indicator showing current date
- See overlapping allocations and availability at a glance

### Find Resources
- Specify required bandwidth percentage
- Select required skills
- Get a ranked list of available developers based on:
  - Skill match percentage
  - Availability date
  - Available bandwidth

### Manage Data
Three management tabs:
1. **Developers**: Add/edit/delete developers and their skills
2. **Projects**: Manage project details, priorities, and required skills
3. **Allocations**: Create and manage developer-to-project assignments with bandwidth and date ranges

## Sample Data

The application comes pre-loaded with sample data:
- 5 developers with various skill sets
- 5 projects at different stages
- Multiple allocations demonstrating various scenarios

## Use Cases

1. **New Project Planning**: Use the availability finder to identify which developers can start on a new project
2. **Capacity Planning**: Check resource view to see who has bandwidth for additional work
3. **Skill Matching**: Find developers with specific expertise for specialized tasks
4. **Timeline Estimation**: Use project view to understand when current initiatives will complete
5. **Team Rebalancing**: Identify overallocated developers and redistribute work

## Customization

The tool is designed to be flexible and can be extended with:
- Backend integration for data persistence
- User authentication
- Export/import capabilities
- Calendar integrations
- Notification systems
- Advanced analytics and reporting

## License

MIT

