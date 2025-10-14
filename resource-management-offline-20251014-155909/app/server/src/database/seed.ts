import pool from '../config/database';

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Insert sample developers
    await pool.query(`
      INSERT INTO developers (id, name, email, skills) VALUES
      ('dev1', 'Alice Johnson', 'alice@company.com', ARRAY['React', 'TypeScript', 'Node.js', 'Homepage']),
      ('dev2', 'Bob Smith', 'bob@company.com', ARRAY['Vue.js', 'Python', 'Django', 'Backend']),
      ('dev3', 'Carol Williams', 'carol@company.com', ARRAY['React', 'GraphQL', 'AWS', 'Homepage', 'Mobile']),
      ('dev4', 'David Brown', 'david@company.com', ARRAY['Angular', 'Java', 'Spring Boot', 'Microservices']),
      ('dev5', 'Emma Davis', 'emma@company.com', ARRAY['React', 'TypeScript', 'Testing', 'CI/CD'])
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Developers seeded');

    // Insert sample projects
    await pool.query(`
      INSERT INTO projects (id, name, description, required_skills, priority, status) VALUES
      ('proj1', 'Homepage Redesign', 'Complete overhaul of the company homepage', 
       ARRAY['React', 'Homepage', 'TypeScript'], 'critical', 'active'),
      ('proj2', 'Mobile App Backend', 'Build scalable backend for mobile application',
       ARRAY['Node.js', 'Backend', 'Mobile'], 'high', 'active'),
      ('proj3', 'Payment Gateway Integration', 'Integrate new payment provider',
       ARRAY['Backend', 'Security'], 'critical', 'planning'),
      ('proj4', 'Analytics Dashboard', 'Build internal analytics dashboard',
       ARRAY['React', 'Data Visualization'], 'medium', 'planning'),
      ('proj5', 'User Authentication Upgrade', 'Modernize authentication system',
       ARRAY['Backend', 'Security', 'Microservices'], 'high', 'active')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Projects seeded');

    // Insert sample allocations
    const today = new Date();
    const getDateOffset = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    await pool.query(`
      INSERT INTO allocations (id, developer_id, project_id, bandwidth, start_date, end_date, notes) VALUES
      ('alloc1', 'dev1', 'proj1', 100, $1, $2, 'Lead developer - Full-time'),
      ('alloc2', 'dev3', 'proj1', 50, $1, $2, 'UI/UX focus - Half-time'),
      ('alloc3', 'dev2', 'proj2', 100, $3, $4, 'Backend lead - Full-time'),
      ('alloc4', 'dev3', 'proj2', 50, $5, $6, 'Mobile expertise consultant - Half-time'),
      ('alloc5', 'dev4', 'proj5', 100, $7, $8, 'Microservices expert - Full-time'),
      ('alloc6', 'dev5', 'proj5', 50, $7, $8, 'Testing and QA - Half-time')
      ON CONFLICT (id) DO NOTHING
    `, [
      getDateOffset(-10), getDateOffset(50),
      getDateOffset(-5), getDateOffset(85),
      getDateOffset(0), getDateOffset(45),
      getDateOffset(-15), getDateOffset(60)
    ]);
    console.log('✅ Allocations seeded');

    console.log('✅ Database seeding completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();

