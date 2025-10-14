# Resource Management Tool - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## Database Setup

### 1. Install PostgreSQL

#### macOS (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE resource_management;

# Create user (optional, or use your existing user)
CREATE USER your_username WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE resource_management TO your_username;

# Exit psql
\q
```

### 3. Update Database Configuration

Copy the example environment files:

**Backend:**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and update the DATABASE_URL:
```
PORT=3001
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/resource_management
NODE_ENV=development
```

**Frontend:**
```bash
cp .env.example .env
```

The `.env` file should contain:
```
VITE_API_URL=http://localhost:3001/api
```

## Installation

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## Database Migration

Run the migration to create database tables:

```bash
cd server
npm run build
npm run db:migrate
```

You should see:
```
✅ Database schema created successfully!
```

## Seed Sample Data

Populate the database with sample data:

```bash
npm run db:seed
```

You should see:
```
✅ Developers seeded
✅ Projects seeded
✅ Allocations seeded
✅ Database seeding completed successfully!
```

## Running the Application

### Development Mode

You need to run both the backend and frontend servers:

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

The backend will start on http://localhost:3001

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```

The frontend will start on http://localhost:5173

### Production Build

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

## Verify Installation

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Check API Endpoints

```bash
# Get all developers
curl http://localhost:3001/api/developers

# Get all projects
curl http://localhost:3001/api/projects

# Get all allocations
curl http://localhost:3001/api/allocations
```

### 3. Open Frontend

Navigate to http://localhost:5173 in your browser. You should see the Resource Management Tool with sample data loaded.

## Troubleshooting

### Database Connection Issues

**Error: "password authentication failed"**
- Check your PostgreSQL username and password in `server/.env`
- Verify PostgreSQL is running: `pg_isready`

**Error: "database does not exist"**
- Create the database: `createdb resource_management`

**Error: "ECONNREFUSED"**
- Make sure PostgreSQL is running
- Check if it's running on the correct port (default: 5432)

### Backend Issues

**Error: "Cannot find module"**
- Run `npm install` in the server directory
- Rebuild: `cd server && npm run build`

**Error: "Port 3001 is already in use"**
- Change the PORT in `server/.env`
- Kill the process using port 3001: `lsof -ti:3001 | xargs kill`

### Frontend Issues

**Error: "API request failed"**
- Make sure the backend server is running
- Check the VITE_API_URL in `.env`
- Verify CORS is enabled in the backend

**Error: "Vite cannot find module"**
- Run `npm install` in the root directory
- Delete `node_modules` and reinstall

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

**Developers:**
- `GET /developers` - Get all developers
- `GET /developers/:id` - Get developer by ID
- `POST /developers` - Create new developer
- `PUT /developers/:id` - Update developer
- `DELETE /developers/:id` - Delete developer

**Projects:**
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

**Allocations:**
- `GET /allocations` - Get all allocations
- `GET /allocations/developer/:developerId` - Get allocations by developer
- `GET /allocations/project/:projectId` - Get allocations by project
- `POST /allocations` - Create new allocation
- `PUT /allocations/:id` - Update allocation
- `DELETE /allocations/:id` - Delete allocation

## Database Schema

### Developers Table
```sql
- id (VARCHAR, PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- skills (TEXT[])
- avatar (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Projects Table
```sql
- id (VARCHAR, PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- required_skills (TEXT[])
- priority (VARCHAR) - 'low', 'medium', 'high', 'critical'
- status (VARCHAR) - 'planning', 'active', 'on-hold', 'completed'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Allocations Table
```sql
- id (VARCHAR, PRIMARY KEY)
- developer_id (VARCHAR, FOREIGN KEY)
- project_id (VARCHAR, FOREIGN KEY)
- bandwidth (INTEGER) - 50 or 100
- start_date (DATE)
- end_date (DATE)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Environment Variables

### Backend (`server/.env`)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment mode (development/production)

### Frontend (`.env`)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)

## Support

If you encounter any issues:
1. Check the console logs (browser and terminal)
2. Verify all services are running
3. Ensure database is properly configured
4. Check environment variables

Happy resource planning! 🚀

