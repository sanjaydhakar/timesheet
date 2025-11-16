import { Router, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserTeamIds, buildTeamFilterQuery } from '../utils/teamUtils';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET all allocations
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const teamIds = await getUserTeamIds(req.userId!);
    const currentTeamId = req.headers['x-current-team-id'] as string;
    
    // If current team ID is provided, filter by that team only
    // Otherwise, filter by all teams the user has access to
    let teamFilter: string;
    let queryParams: string[];
    
    if (currentTeamId && teamIds.includes(currentTeamId)) {
      teamFilter = 'a.team_id = $1';
      queryParams = [currentTeamId];
    } else {
      teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
      queryParams = teamIds;
    }
    
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name, u.email as created_by_email 
       FROM allocations a 
       LEFT JOIN users u ON a.created_by = u.id 
       WHERE ${teamFilter} ORDER BY a.start_date ASC`,
      queryParams
    );
    
    // Convert date strings to Date objects for consistency with frontend
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      created_at: new Date(row.created_at),
    }));
    
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// GET allocations by developer
router.get('/developer/:developerId', async (req: AuthRequest, res: Response) => {
  try {
    const { developerId } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
    
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name, u.email as created_by_email 
       FROM allocations a 
       LEFT JOIN users u ON a.created_by = u.id 
       WHERE a.developer_id = $1 AND ${teamFilter} ORDER BY a.start_date ASC`,
      [developerId, ...teamIds]
    );
    
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      created_at: new Date(row.created_at),
    }));
    
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// GET allocations by project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds);
    
    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name, u.email as created_by_email 
       FROM allocations a 
       LEFT JOIN users u ON a.created_by = u.id 
       WHERE a.project_id = $1 AND ${teamFilter} ORDER BY a.start_date ASC`,
      [projectId, ...teamIds]
    );
    
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      created_at: new Date(row.created_at),
    }));
    
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// POST create new allocation
router.post(
  '/',
  [
    body('developer_id').notEmpty(),
    body('project_id').notEmpty(),
    body('bandwidth').isIn([50, 100]),
    body('start_date').isISO8601(),
    body('end_date').isISO8601(),
    body('teamId').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, developer_id, project_id, bandwidth, start_date, end_date, notes, teamId } = req.body;
      
      // Verify user has access to the team
      const teamIds = await getUserTeamIds(req.userId!);
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({ error: 'Access denied to this team' });
      }
      
      // Validate date range
      if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      
      // Generate ID if not provided
      const allocationId = id || `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await pool.query(
        'INSERT INTO allocations (id, developer_id, project_id, bandwidth, start_date, end_date, notes, team_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [allocationId, developer_id, project_id, bandwidth, start_date, end_date, notes || null, teamId, req.userId]
      );
      
      const allocation = {
        ...result.rows[0],
        start_date: new Date(result.rows[0].start_date),
        end_date: new Date(result.rows[0].end_date),
      };
      
      res.status(201).json(allocation);
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid developer or project ID' });
      }
      res.status(500).json({ error: 'Failed to create allocation' });
    }
  }
);

// PUT update allocation
router.put(
  '/:id',
  [
    body('developer_id').optional().notEmpty(),
    body('project_id').optional().notEmpty(),
    body('bandwidth').optional().isIn([50, 100]),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    body('teamId').optional().notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { developer_id, project_id, bandwidth, start_date, end_date, notes, teamId } = req.body;
      
      // If teamId is provided, verify user has access to it
      if (teamId) {
        const teamIds = await getUserTeamIds(req.userId!);
        if (!teamIds.includes(teamId)) {
          return res.status(403).json({ error: 'Access denied to this team' });
        }
      }
      
      const teamIds = await getUserTeamIds(req.userId!);
      const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 8);
      
      const result = await pool.query(
        `UPDATE allocations 
         SET developer_id = COALESCE($1, developer_id),
             project_id = COALESCE($2, project_id),
             bandwidth = COALESCE($3, bandwidth),
             start_date = COALESCE($4, start_date),
             end_date = COALESCE($5, end_date),
             notes = COALESCE($6, notes),
             team_id = COALESCE($7, team_id)
         WHERE id = $8 AND ${teamFilter}
         RETURNING *`,
        [developer_id, project_id, bandwidth, start_date, end_date, notes, teamId, id, ...teamIds]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Allocation not found' });
      }
      
      const allocation = {
        ...result.rows[0],
        start_date: new Date(result.rows[0].start_date),
        end_date: new Date(result.rows[0].end_date),
      };
      
      res.json(allocation);
    } catch (error) {
      console.error('Error updating allocation:', error);
      res.status(500).json({ error: 'Failed to update allocation' });
    }
  }
);

// DELETE allocation
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teamIds = await getUserTeamIds(req.userId!);
    const teamFilter = buildTeamFilterQuery(req.userId!, teamIds, 1);
    
    const result = await pool.query(
      `DELETE FROM allocations WHERE id = $1 AND ${teamFilter} RETURNING *`,
      [id, ...teamIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

export default router;

