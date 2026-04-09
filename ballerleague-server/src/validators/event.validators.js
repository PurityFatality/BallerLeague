import { body, param } from 'express-validator';

export const createEventValidator = [
  body('id').trim().notEmpty().withMessage('id is required'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('location').optional().isString().withMessage('location must be a string'),
  body('start.dateTime').trim().notEmpty().withMessage('start.dateTime is required'),
  body('start.timeZone').trim().notEmpty().withMessage('start.timeZone is required'),
  body('end.dateTime').trim().notEmpty().withMessage('end.dateTime is required'),
  body('end.timeZone').trim().notEmpty().withMessage('end.timeZone is required'),
  body('allDay').optional().isBoolean().withMessage('allDay must be boolean'),
  body('googleCalendarEventId').optional({ nullable: true }).isString().withMessage('googleCalendarEventId must be a string or null')
];

export const eventIdParamValidator = [
  param('id').trim().notEmpty().withMessage('id param is required')
];

export const updateGoogleCalendarEventIdValidator = [
  param('id').trim().notEmpty().withMessage('id param is required'),
  body('googleCalendarEventId')
    .optional({ nullable: true })
    .isString()
    .withMessage('googleCalendarEventId must be a string or null')
];
