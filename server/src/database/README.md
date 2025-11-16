# Database Schema and Migrations

This directory contains the database schema and migration files for the Resource Management Tool.

## Files

- `schema.sql`: Base schema with developers, projects, and allocations tables
- `add_authentication.sql`: Adds users table and authentication support
- `add_devs_needed.sql`: Adds devs_needed column to projects table
- `add_project_dates.sql`: Adds start_date and end_date columns to projects table
- `add_allocation_tracking.sql`: Adds tracking fields to allocations table
- `add_teams.sql`: Adds teams and user-teams tables and relationships
- `complete_schema.sql`: Consolidated schema with all tables and relationships

## Using the Complete Schema

The `complete_schema.sql` file contains the complete database schema with all tables, relationships, indexes, and functions. This file can be used to set up a fresh database with all the required tables and relationships.

### Running the Complete Schema Migration

To run the complete schema migration:

```bash
npm run db:migrate:complete
```

This will drop all existing tables and create a fresh database with the complete schema.

### Running Individual Migrations

If you prefer to run individual migrations:

```bash
npm run db:migrate
```

This will run the migrations in the following order:
1. schema.sql
2. add_authentication.sql
3. add_devs_needed.sql
4. add_project_dates.sql
5. add_allocation_tracking.sql
6. add_teams.sql

## Database Structure

The database has the following main tables:

1. **users**: Authentication and user management
2. **teams**: Team management
3. **user_teams**: Many-to-many relationship between users and teams
4. **developers**: Developer profiles
5. **projects**: Project details
6. **allocations**: Resource allocations (many-to-many between developers and projects)

Each table has appropriate indexes and foreign key relationships for optimal performance and data integrity.
