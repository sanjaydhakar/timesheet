import pool from '../config/database';

export async function getUserTeamIds(userId: string): Promise<string[]> {
  const result = await pool.query(
    'SELECT team_id FROM user_teams WHERE user_id = $1',
    [userId]
  );
  return result.rows.map(row => row.team_id);
}

export async function userHasTeamAccess(userId: string, teamId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM user_teams WHERE user_id = $1 AND team_id = $2',
    [userId, teamId]
  );
  return result.rows.length > 0;
}

export function buildTeamFilterQuery(userId: string, teamIds: string[], offset: number = 0): string {
  if (teamIds.length === 0) {
    return '1 = 0'; // No access to any teams
  }
  
  const placeholders = teamIds.map((_, index) => `$${index + offset + 1}`).join(',');
  return `team_id IN (${placeholders})`;
}

