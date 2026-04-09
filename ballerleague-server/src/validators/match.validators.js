import { body, param } from 'express-validator';

export const matchIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('match id must be a positive integer')
];

export const createManualMatchValidator = [
  body('season_id').isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  body('home_team_id').isInt({ min: 1 }).withMessage('home_team_id must be a positive integer'),
  body('away_team_id').isInt({ min: 1 }).withMessage('away_team_id must be a positive integer'),
  body('away_team_id')
    .custom((value, { req }) => Number(value) !== Number(req.body.home_team_id))
    .withMessage('home_team_id and away_team_id must be different'),
  body('kickoff_at').isISO8601().withMessage('kickoff_at must be a valid ISO date-time'),
  body('venue').optional().trim(),
  body('published').optional().isBoolean().withMessage('published must be a boolean')
];

export const updateMatchScheduleValidator = [
  ...matchIdParamValidator,
  body('kickoff_at').optional().isISO8601().withMessage('kickoff_at must be a valid ISO date-time'),
  body('venue').optional().trim(),
  body('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer')
];

export const updateMatchStatusValidator = [
  ...matchIdParamValidator,
  body('status')
    .isIn(['scheduled', 'postponed', 'cancelled', 'completed'])
    .withMessage('status must be scheduled, postponed, cancelled, or completed'),
  body('status_note').optional().trim()
];

export const publishMatchValidator = [
  ...matchIdParamValidator,
  body('published').isBoolean().withMessage('published must be a boolean')
];

export const publishScheduleValidator = [
  body('season_id').optional().isInt({ min: 1 }).withMessage('season_id must be a positive integer'),
  body('published').optional().isBoolean().withMessage('published must be a boolean')
];
