-- Add team functionality to the resource management system
-- This migration adds teams and user-team relationships

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_teams junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_teams (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id VARCHAR(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, team_id)
);

-- Add team_id to developers table
ALTER TABLE developers ADD COLUMN IF NOT EXISTS team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_developers_team ON developers(team_id);

-- Add team_id to projects table  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);

-- Add team_id to allocations table
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_allocations_team ON allocations(team_id);

-- Add triggers for teams updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team ON user_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_role ON user_teams(role);

-- Create a function to get user's teams
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

-- Create a function to check if user has access to team
CREATE OR REPLACE FUNCTION user_has_team_access(p_user_id VARCHAR(50), p_team_id VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_teams 
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user's accessible team IDs
CREATE OR REPLACE FUNCTION get_user_team_ids(p_user_id VARCHAR(50))
RETURNS VARCHAR(50)[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT team_id FROM user_teams WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

