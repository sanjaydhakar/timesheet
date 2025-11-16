import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    // Run main schema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    
    await pool.query(schemaSQL);
    console.log('✅ Database schema created successfully!');
    
    // Run authentication migration
    const authSQL = fs.readFileSync(
      path.join(__dirname, 'add_authentication.sql'),
      'utf-8'
    );
    
    await pool.query(authSQL);
    console.log('✅ Authentication tables added successfully!');
    
    // Run teams migration
    const teamsSQL = fs.readFileSync(
      path.join(__dirname, 'add_teams.sql'),
      'utf-8'
    );
    
    await pool.query(teamsSQL);
    console.log('✅ Team functionality added successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();

