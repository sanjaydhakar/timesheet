-- Add authentication support
-- Create users table and add user_id to all existing tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to developers table
ALTER TABLE developers ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_developers_user ON developers(user_id);

-- Add user_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- Add user_id to allocations table
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_allocations_user ON allocations(user_id);

-- Add trigger for users updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index on users email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

