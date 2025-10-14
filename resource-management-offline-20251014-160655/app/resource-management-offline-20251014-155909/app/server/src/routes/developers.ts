import { Router, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET all developers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM developers WHERE user_id = $1 ORDER BY name ASC',
      [req.userId]
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
    const result = await pool.query(
      'SELECT * FROM developers WHERE id = $1 AND user_id = $2',
      [id, req.userId]
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
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, name, email, skills, avatar } = req.body;
      const result = await pool.query(
        'INSERT INTO developers (id, name, email, skills, avatar, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, name, email, skills, avatar || null, req.userId]
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
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, email, skills, avatar } = req.body;
      
      const result = await pool.query(
        `UPDATE developers 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             skills = COALESCE($3, skills),
             avatar = COALESCE($4, avatar)
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [name, email, skills, avatar, id, req.userId]
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
    const result = await pool.query(
      'DELETE FROM developers WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
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

