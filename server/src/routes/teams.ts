import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's teams
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.description,
        ut.role,
        ut.joined_at as "joinedAt"
      FROM teams t
      JOIN user_teams ut ON t.id = ut.team_id
      WHERE ut.user_id = $1
      ORDER BY ut.joined_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new team
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;
      const teamId = uuidv4();

      // Create team
      await pool.query(
        'INSERT INTO teams (id, name, description, created_by) VALUES ($1, $2, $3, $4)',
        [teamId, name, description || null, req.userId]
      );

      // Add creator as admin
      const userTeamId = uuidv4();
      await pool.query(
        'INSERT INTO user_teams (id, user_id, team_id, role) VALUES ($1, $2, $3, $4)',
        [userTeamId, req.userId, teamId, 'admin']
      );

      // Return team info
      const result = await pool.query(
        `SELECT 
          t.id,
          t.name,
          t.description,
          ut.role,
          ut.joined_at as "joinedAt"
        FROM teams t
        JOIN user_teams ut ON t.id = ut.team_id
        WHERE t.id = $1 AND ut.user_id = $2`,
        [teamId, req.userId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ error: 'Failed to create team' });
    }
  }
);

// Join a team (by invitation code or team ID)
router.post(
  '/join',
  authenticateToken,
  [
    body('teamId').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { teamId } = req.body;

      // Check if team exists
      const teamResult = await pool.query(
        'SELECT id, name FROM teams WHERE id = $1',
        [teamId]
      );

      if (teamResult.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Check if user is already a member
      const existingMember = await pool.query(
        'SELECT id FROM user_teams WHERE user_id = $1 AND team_id = $2',
        [req.userId, teamId]
      );

      if (existingMember.rows.length > 0) {
        return res.status(400).json({ error: 'Already a member of this team' });
      }

      // Add user to team
      const userTeamId = uuidv4();
      await pool.query(
        'INSERT INTO user_teams (id, user_id, team_id, role) VALUES ($1, $2, $3, $4)',
        [userTeamId, req.userId, teamId, 'member']
      );

      // Return team info
      const result = await pool.query(
        `SELECT 
          t.id,
          t.name,
          t.description,
          ut.role,
          ut.joined_at as "joinedAt"
        FROM teams t
        JOIN user_teams ut ON t.id = ut.team_id
        WHERE t.id = $1 AND ut.user_id = $2`,
        [teamId, req.userId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error joining team:', error);
      res.status(500).json({ error: 'Failed to join team' });
    }
  }
);

// Leave a team
router.delete(
  '/:teamId/leave',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;

      // Check if user is a member
      const memberResult = await pool.query(
        'SELECT role FROM user_teams WHERE user_id = $1 AND team_id = $2',
        [req.userId, teamId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(404).json({ error: 'Not a member of this team' });
      }

      // Check if user is the only admin
      if (memberResult.rows[0].role === 'admin') {
        const adminCount = await pool.query(
          'SELECT COUNT(*) FROM user_teams WHERE team_id = $1 AND role = $2',
          [teamId, 'admin']
        );

        if (parseInt(adminCount.rows[0].count) === 1) {
          return res.status(400).json({ 
            error: 'Cannot leave team as the only admin. Transfer admin role first or delete the team.' 
          });
        }
      }

      // Remove user from team
      await pool.query(
        'DELETE FROM user_teams WHERE user_id = $1 AND team_id = $2',
        [req.userId, teamId]
      );

      res.json({ message: 'Successfully left team' });
    } catch (error) {
      console.error('Error leaving team:', error);
      res.status(500).json({ error: 'Failed to leave team' });
    }
  }
);

// Get team members
router.get(
  '/:teamId/members',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;

      // Check if user has access to this team
      const hasAccess = await pool.query(
        'SELECT 1 FROM user_teams WHERE user_id = $1 AND team_id = $2',
        [req.userId, teamId]
      );

      if (hasAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this team' });
      }

      // Get team members
      const result = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          ut.role,
          ut.joined_at as "joinedAt"
        FROM users u
        JOIN user_teams ut ON u.id = ut.user_id
        WHERE ut.team_id = $1
        ORDER BY ut.joined_at ASC`,
        [teamId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  }
);

// Update team information (admin only)
router.put(
  '/:teamId',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { teamId } = req.params;
      const { name, description } = req.body;

      // Check if user is admin of this team
      const adminCheck = await pool.query(
        'SELECT role FROM user_teams WHERE user_id = $1 AND team_id = $2 AND role = $3',
        [req.userId, teamId, 'admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Update team
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(name);
        paramCount++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(description);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updateValues.push(teamId);
      const query = `UPDATE teams SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
      
      await pool.query(query, updateValues);

      // Return updated team info
      const result = await pool.query(
        `SELECT 
          t.id,
          t.name,
          t.description,
          ut.role,
          ut.joined_at as "joinedAt"
        FROM teams t
        JOIN user_teams ut ON t.id = ut.team_id
        WHERE t.id = $1 AND ut.user_id = $2`,
        [teamId, req.userId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ error: 'Failed to update team' });
    }
  }
);

// Delete team (admin only)
router.delete(
  '/:teamId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;

      // Check if user is admin of this team
      const adminCheck = await pool.query(
        'SELECT role FROM user_teams WHERE user_id = $1 AND team_id = $2 AND role = $3',
        [req.userId, teamId, 'admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Delete team (cascade will handle related records)
      await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);

      res.json({ message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  }
);

export default router;

