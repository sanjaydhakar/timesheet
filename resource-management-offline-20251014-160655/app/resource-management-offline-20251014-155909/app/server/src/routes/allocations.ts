import { Router, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET all allocations
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM allocations WHERE user_id = $1 ORDER BY start_date ASC',
      [req.userId]
    );
    
    // Convert date strings to Date objects for consistency with frontend
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
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
    const result = await pool.query(
      'SELECT * FROM allocations WHERE developer_id = $1 AND user_id = $2 ORDER BY start_date ASC',
      [developerId, req.userId]
    );
    
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
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
    const result = await pool.query(
      'SELECT * FROM allocations WHERE project_id = $1 AND user_id = $2 ORDER BY start_date ASC',
      [projectId, req.userId]
    );
    
    const allocations = result.rows.map(row => ({
      ...row,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
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
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, developer_id, project_id, bandwidth, start_date, end_date, notes } = req.body;
      
      // Validate date range
      if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      
      const result = await pool.query(
        'INSERT INTO allocations (id, developer_id, project_id, bandwidth, start_date, end_date, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, developer_id, project_id, bandwidth, start_date, end_date, notes || null, req.userId]
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
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { developer_id, project_id, bandwidth, start_date, end_date, notes } = req.body;
      
      const result = await pool.query(
        `UPDATE allocations 
         SET developer_id = COALESCE($1, developer_id),
             project_id = COALESCE($2, project_id),
             bandwidth = COALESCE($3, bandwidth),
             start_date = COALESCE($4, start_date),
             end_date = COALESCE($5, end_date),
             notes = COALESCE($6, notes)
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [developer_id, project_id, bandwidth, start_date, end_date, notes, id, req.userId]
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
    const result = await pool.query(
      'DELETE FROM allocations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
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

