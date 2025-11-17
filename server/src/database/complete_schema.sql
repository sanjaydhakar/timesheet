-- Complete Resource Management Database Schema
-- This file contains the complete schema for the Resource Management Tool
-- including all tables, relationships, indexes, and functions

-- -- Drop tables if they exist (for clean migration)
-- DROP TABLE IF EXISTS user_teams CASCADE;
-- DROP TABLE IF EXISTS teams CASCADE;
-- DROP TABLE IF EXISTS allocations CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS developers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (Authentication)
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Teams junction table for many-to-many relationship
CREATE TABLE user_teams (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id VARCHAR(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, team_id)
);

-- Developers table
CREATE TABLE developers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  avatar VARCHAR(500),
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('planning', 'active', 'on-hold', 'completed')) NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  devs_needed INTEGER CHECK (devs_needed > 0),
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Allocations table (many-to-many relationship)
CREATE TABLE allocations (
  id VARCHAR(50) PRIMARY KEY,
  developer_id VARCHAR(50) NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bandwidth INTEGER CHECK (bandwidth IN (50, 100)) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for better query performance
-- Developer indexes
CREATE INDEX idx_developers_email ON developers(email);
CREATE INDEX idx_developers_user ON developers(user_id);
CREATE INDEX idx_developers_team ON developers(team_id);

-- Project indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_team ON projects(team_id);

-- Allocation indexes
CREATE INDEX idx_allocations_developer ON allocations(developer_id);
CREATE INDEX idx_allocations_project ON allocations(project_id);
CREATE INDEX idx_allocations_dates ON allocations(start_date, end_date);
CREATE INDEX idx_allocations_user ON allocations(user_id);
CREATE INDEX idx_allocations_team ON allocations(team_id);
CREATE INDEX idx_allocations_created_by ON allocations(created_by);

-- Team indexes
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_user_teams_user ON user_teams(user_id);
CREATE INDEX idx_user_teams_team ON user_teams(team_id);
CREATE INDEX idx_user_teams_role ON user_teams(role);

-- User indexes
CREATE INDEX idx_users_email ON users(email);

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON COLUMN projects.devs_needed IS 'Optional field indicating how many developers are needed for this project';
COMMENT ON COLUMN allocations.created_by IS 'User who created this allocation';
COMMENT ON COLUMN allocations.created_at IS 'When this allocation was created';

-- Team-related functions
-- Function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id VARCHAR(50))
RETURNS TABLE (
  team_id VARCHAR(50),
  team_name VARCHAR(255),
  team_description TEXT,
  role VARCHAR(20),
  joined_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    t.description as team_description,
    ut.role,
    ut.joined_at
  FROM teams t
  JOIN user_teams ut ON t.id = ut.team_id
  WHERE ut.user_id = p_user_id
  ORDER BY ut.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has access to team
CREATE OR REPLACE FUNCTION user_has_team_access(p_user_id VARCHAR(50), p_team_id VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_teams 
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible team IDs
CREATE OR REPLACE FUNCTION get_user_team_ids(p_user_id VARCHAR(50))
RETURNS VARCHAR(50)[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT team_id FROM user_teams WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;
