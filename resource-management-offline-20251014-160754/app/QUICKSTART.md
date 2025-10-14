# Quick Start Guide

This is the fastest way to get the Resource Management Tool running with PostgreSQL database.

## Prerequisites Check

```bash
# Check if PostgreSQL is installed
psql --version

# Check if Node.js is installed
node --version  # Should be v18+

# Check if npm is installed
npm --version
```

## 5-Minute Setup

### 1. Create Database (1 minute)

```bash
# Create the database
createdb resource_management

# Verify it was created
psql -l | grep resource_management
```

### 2. Configure Backend (1 minute)

```bash
# Copy environment file
cp server/.env.example server/.env

# Edit server/.env with your credentials
# If using default PostgreSQL user:
# DATABASE_URL=postgresql://$(whoami)@localhost:5432/resource_management
```

**Edit `server/.env`:**
```env
PORT=3001
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/resource_management
NODE_ENV=development
```

### 3. Install Dependencies (2 minutes)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 4. Setup Database (1 minute)

```bash
cd server
npm run build
npm run db:migrate
npm run db:seed
cd ..
```

You should see:
```
✅ Database schema created successfully!
✅ Developers seeded
✅ Projects seeded
✅ Allocations seeded
```

### 5. Run the Application

**Open 2 terminals:**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access the Application

🌐 **Frontend:** http://localhost:5173  
🔌 **Backend API:** http://localhost:3001/api  
❤️ **Health Check:** http://localhost:3001/health

## Verify Everything Works

### Test Backend API

```bash
# Check health
curl http://localhost:3001/health

# Get developers
curl http://localhost:3001/api/developers

# Get projects
curl http://localhost:3001/api/projects

# Get allocations
curl http://localhost:3001/api/allocations
```

### Test Frontend

1. Open http://localhost:5173
2. You should see the Resource Management Tool
3. Navigate through different views (Resources, Projects, Timeline)
4. Sample data should be loaded automatically

## Common Issues

### "database does not exist"
```bash
createdb resource_management
```

### "password authentication failed"
Update `DATABASE_URL` in `server/.env` with correct credentials.

### "Port 3001 already in use"
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill

# Or change PORT in server/.env
```

### "Cannot connect to database"
```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql     # Linux
```

### Frontend shows "Unable to Connect"
1. Make sure backend is running on port 3001
2. Check `VITE_API_URL` in `.env` (should be `http://localhost:3001/api`)

## What's Included

### Sample Data
- **5 Developers** with different skill sets
- **5 Projects** at various stages
- **6 Allocations** showing realistic scenarios

### Features Ready to Use
- ✅ Resource View - See developer allocations
- ✅ Project View - See project details
- ✅ Timeline View - Visual Gantt chart
- ✅ Availability Finder - Find free developers
- ✅ Manage Data - Add/edit/delete resources

### Database Tables
- `developers` - Developer information and skills
- `projects` - Project details and priorities
- `allocations` - Developer-project assignments

## Next Steps

1. **Explore the UI** - Navigate through all views
2. **Add Your Team** - Replace sample data with real developers
3. **Create Projects** - Add your actual projects
4. **Allocate Resources** - Assign developers to projects
5. **Plan Ahead** - Use Timeline View to visualize capacity

## Development Commands

```bash
# Backend
cd server
npm run dev          # Development mode with hot reload
npm run build        # Build TypeScript
npm start            # Production mode
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed sample data

# Frontend
npm run dev          # Development mode
npm run build        # Production build
npm run preview      # Preview production build
```

## Need Help?

See [SETUP.md](SETUP.md) for detailed documentation.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Express   │ ◄─────► │ PostgreSQL  │
│  (React)    │         │   Server    │         │  Database   │
│  Port 5173  │         │  Port 3001  │         │  Port 5432  │
└─────────────┘         └─────────────┘         └─────────────┘
```

Happy resource planning! 🚀

