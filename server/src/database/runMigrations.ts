import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Runs a SQL query from a file
 */
async function runSqlFile(filePath: string): Promise<void> {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ Successfully executed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigrations(useCompleteSchema = false): Promise<void> {
  console.log('Starting database migrations...');
  
  try {
    if (useCompleteSchema) {
      // Use the complete schema file instead of individual migrations
      console.log('Using complete schema file for migration...');
      await runSqlFile(path.join(__dirname, 'complete_schema.sql'));
      console.log('✅ Complete schema migration successful!');
    } else {
      // Run base schema first
      console.log('Running base schema...');
      await runSqlFile(path.join(__dirname, 'schema.sql'));
      
      // Run authentication schema
      console.log('Adding authentication...');
      await runSqlFile(path.join(__dirname, 'add_authentication.sql'));
      
      // Run additional migrations in order
      console.log('Running additional migrations...');
      
      const migrationFiles = [
        'add_devs_needed.sql',
        'add_project_dates.sql',
        'add_allocation_tracking.sql',
        'add_teams.sql'
      ];
      
      for (const file of migrationFiles) {
        console.log(`Processing ${file}...`);
        await runSqlFile(path.join(__dirname, file));
      }
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if this file is being run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const useCompleteSchema = args.includes('--complete') || args.includes('-c');
  
  runMigrations(useCompleteSchema)
    .then(() => {
      console.log('Migration process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}

export { runMigrations };
