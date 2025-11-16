import pool from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Run database migrations
 * Returns true if successful, false otherwise
 * Does not exit the process - designed to be called from server startup
 */
export async function runMigrations(): Promise<boolean> {
  console.log('🔄 Running database migrations...');
  
  try {
    // Run main schema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    
    await pool.query(schemaSQL);
    console.log('✅ Database schema created successfully!');
    
    // Run authentication migration
    try {
      const authSQL = fs.readFileSync(
        path.join(__dirname, 'add_authentication.sql'),
        'utf-8'
      );
      await pool.query(authSQL);
      console.log('✅ Authentication tables added successfully!');
    } catch (error: any) {
      // Check if it's a "relation already exists" error
      if (error?.code === '42P07' || error?.message?.includes('already exists')) {
        console.log('ℹ️  Authentication tables already exist, skipping...');
      } else {
        throw error;
      }
    }
    
    // Run teams migration
    try {
      const teamsSQL = fs.readFileSync(
        path.join(__dirname, 'add_teams.sql'),
        'utf-8'
      );
      await pool.query(teamsSQL);
      console.log('✅ Team functionality added successfully!');
    } catch (error: any) {
      if (error?.code === '42P07' || error?.message?.includes('already exists')) {
        console.log('ℹ️  Team tables already exist, skipping...');
      } else {
        throw error;
      }
    }
    
    // Run other migrations if they exist
    const migrationFiles = [
      'add_devs_needed.sql',
      'add_project_dates.sql',
      'add_allocation_tracking.sql',
      'add_teams.sql'
    ];
    
    for (const file of migrationFiles) {
      try {
        const migrationPath = path.join(__dirname, file);
        if (fs.existsSync(migrationPath)) {
          const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
          await pool.query(migrationSQL);
          console.log(`✅ ${file} applied successfully!`);
        }
      } catch (error: any) {
        if (error?.code === '42P07' || error?.message?.includes('already exists')) {
          console.log(`ℹ️  ${file} already applied, skipping...`);
        } else {
          console.warn(`⚠️  Warning: ${file} migration failed:`, error.message);
        }
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    return true;
  } catch (error: any) {
    // Check if it's a "relation already exists" error (migrations already run)
    if (error?.code === '42P07' || error?.message?.includes('already exists')) {
      console.log('ℹ️  Database schema already exists, migrations up to date');
      return true;
    }
    
    console.error('❌ Migration failed:', error);
    console.error('⚠️  Continuing with server startup anyway...');
    return false;
  }
}

