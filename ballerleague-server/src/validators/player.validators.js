import { body } from 'express-validator';

export const createPlayerValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('team_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('team_id must be a positive integer'),
  body('season_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  body('position').optional().trim(),
  body('number').optional().isInt({ min: 0 }).withMessage('number must be a positive integer'),
  body('nationality').optional().trim(),
  body('avatar').optional().trim(),
  body('apps').optional().isInt({ min: 0 }).withMessage('apps must be a positive integer'),
  body('goals').optional().isInt({ min: 0 }).withMessage('goals must be a positive integer'),
  body('assists').optional().isInt({ min: 0 }).withMessage('assists must be a positive integer'),
  body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('rating must be between 0 and 10')
];
