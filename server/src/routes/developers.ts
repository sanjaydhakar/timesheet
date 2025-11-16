import { Router, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserTeamIds, buildTeamFilterQuery } from '../utils/teamUtils';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET all developers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const teamIds = await getUserTeamIds(req.userId!);
    const currentTeamId = req.headers['x-current-team-id'] as string;
    
    // If current team ID is provided, filter by that team only
    // Otherwise, filter by all teams the user has access to
    let teamFilter: string;
    let queryParams: string[];
    
    if (currentTeamId && teamIds.includes(currentTeamId)) {
      teamFilter = 'team_id = $1';
      queryParams = [currentTeamId];
    } else {
      teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
      queryParams = teamIds;
    }
    
    const result = await pool.query(
      `SELECT * FROM developers WHERE ${teamFilter} ORDER BY name ASC`,
      queryParams
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).json({ error: 'Failed to fetch developers' });
  }
});

// GET single developer by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
    
    const result = await pool.query(
      `SELECT * FROM developers WHERE id = $1 AND ${teamFilter}`,
      [id, ...teamIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Developer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching developer:', error);
    res.status(500).json({ error: 'Failed to fetch developer' });
  }
});

// POST create new developer
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('skills').isArray(),
    body('teamId').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, name, email, skills, avatar, teamId } = req.body;
      
      // Verify user has access to the team
      const teamIds = await getUserTeamIds(req.userId!);
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({ error: 'Access denied to this team' });
      }
      
      // Generate ID if not provided
      const developerId = id || `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await pool.query(
        'INSERT INTO developers (id, name, email, skills, avatar, team_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [developerId, name, email, skills, avatar || null, teamId]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating developer:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Developer with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create developer' });
    }
  }
);

// PUT update developer
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('skills').optional().isArray(),
    body('teamId').optional().notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, email, skills, avatar, teamId } = req.body;
      
      // If teamId is provided, verify user has access to it
      if (teamId) {
        const teamIds = await getUserTeamIds(req.userId!);
        if (!teamIds.includes(teamId)) {
          return res.status(403).json({ error: 'Access denied to this team' });
        }
      }
      
      const teamIds = await getUserTeamIds(req.userId!);
      const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 6);
      
      const result = await pool.query(
        `UPDATE developers 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             skills = COALESCE($3, skills),
             avatar = COALESCE($4, avatar),
             team_id = COALESCE($5, team_id)
         WHERE id = $6 AND ${teamFilter}
         RETURNING *`,
        [name, email, skills, avatar, teamId, id, ...teamIds]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Developer not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating developer:', error);
      res.status(500).json({ error: 'Failed to update developer' });
    }
  }
);

// DELETE developer
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 1);
    
    const result = await pool.query(
      `DELETE FROM developers WHERE id = $1 AND ${teamFilter} RETURNING *`,
      [id, ...teamIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Developer not found' });
    }
    
    res.json({ message: 'Developer deleted successfully' });
  } catch (error) {
    console.error('Error deleting developer:', error);
    res.status(500).json({ error: 'Failed to delete developer' });
  }
});

export default router;

