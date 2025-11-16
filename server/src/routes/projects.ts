import { Router, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserTeamIds, buildTeamFilterQuery } from '../utils/teamUtils';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET all projects
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
      `SELECT * FROM projects WHERE ${teamFilter} ORDER BY priority DESC, name ASC`,
      queryParams
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
    
    const result = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND ${teamFilter}`,
      [id, ...teamIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST create new project
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('required_skills').isArray(),
    body('priority').isIn(['low', 'medium', 'high', 'critical']),
    body('status').isIn(['planning', 'active', 'on-hold', 'completed']),
    body('devs_needed').optional().isInt({ min: 1 }),
    body('teamId').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, name, description, required_skills, priority, status, start_date, end_date, devs_needed, teamId } = req.body;
      
      // Verify user has access to the team
      const teamIds = await getUserTeamIds(req.userId!);
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({ error: 'Access denied to this team' });
      }
      
      // Generate ID if not provided
      const projectId = id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await pool.query(
        'INSERT INTO projects (id, name, description, required_skills, priority, status, start_date, end_date, devs_needed, team_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [projectId, name, description || '', required_skills, priority, status, start_date || null, end_date || null, devs_needed || null, teamId]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// PUT update project
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('description').optional().notEmpty().trim(),
    body('required_skills').optional().isArray(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed']),
    body('devs_needed').optional().isInt({ min: 1 }),
    body('teamId').optional().notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, description, required_skills, priority, status, start_date, end_date, devs_needed, teamId } = req.body;
      
      // If teamId is provided, verify user has access to it
      if (teamId) {
        const teamIds = await getUserTeamIds(req.userId!);
        if (!teamIds.includes(teamId)) {
          return res.status(403).json({ error: 'Access denied to this team' });
        }
      }
      
      const teamIds = await getUserTeamIds(req.userId!);
      const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 10);
      
      const result = await pool.query(
        `UPDATE projects 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             required_skills = COALESCE($3, required_skills),
             priority = COALESCE($4, priority),
             status = COALESCE($5, status),
             start_date = COALESCE($6, start_date),
             end_date = COALESCE($7, end_date),
             devs_needed = COALESCE($8, devs_needed),
             team_id = COALESCE($9, team_id)
         WHERE id = $10 AND ${teamFilter}
         RETURNING *`,
        [name, description, required_skills, priority, status, start_date, end_date, devs_needed, teamId, id, ...teamIds]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// DELETE project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 1);
    
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 AND ${teamFilter} RETURNING *`,
      [id, ...teamIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;

