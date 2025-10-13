import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

const router = Router();

// GET all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects ORDER BY priority DESC, name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
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
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, name, description, required_skills, priority, status, start_date, end_date } = req.body;
      const result = await pool.query(
        'INSERT INTO projects (id, name, description, required_skills, priority, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, name, description || '', required_skills, priority, status, start_date || null, end_date || null]
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
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, description, required_skills, priority, status, start_date, end_date } = req.body;
      
      const result = await pool.query(
        `UPDATE projects 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             required_skills = COALESCE($3, required_skills),
             priority = COALESCE($4, priority),
             status = COALESCE($5, status),
             start_date = COALESCE($6, start_date),
             end_date = COALESCE($7, end_date)
         WHERE id = $8
         RETURNING *`,
        [name, description, required_skills, priority, status, start_date, end_date, id]
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
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

