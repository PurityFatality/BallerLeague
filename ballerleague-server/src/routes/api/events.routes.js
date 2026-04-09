import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireAnyRole } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createEventValidator,
  eventIdParamValidator,
  updateGoogleCalendarEventIdValidator
} from '../../validators/event.validators.js';
import { Event } from '../../models/event.model.js';

const router = Router();

function ensureMongoConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'MongoDB is not connected. Set MONGODB_URI in ballerleague-server/.env and restart the server.'
    });
    return false;
  }

  return true;
}

router.get('/', async (req, res) => {
  if (!ensureMongoConnected(res)) {
    return;
  }

  try {
    const events = await Event.find({}, { _id: 0 }).sort({ 'start.dateTime': 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load events', error: error.message });
  }
});

router.get('/:id', eventIdParamValidator, validateRequest, async (req, res) => {
  if (!ensureMongoConnected(res)) {
    return;
  }

  try {
    const event = await Event.findOne({ id: req.params.id }, { _id: 0 });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load event', error: error.message });
  }
});

router.post(
  '/',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  createEventValidator,
  validateRequest,
  async (req, res) => {
  if (!ensureMongoConnected(res)) {
    return;
  }

  try {
    const event = await Event.create({
      id: req.body.id,
      title: req.body.title,
      description: req.body.description ?? '',
      location: req.body.location ?? '',
      start: {
        dateTime: req.body.start.dateTime,
        timeZone: req.body.start.timeZone
      },
      end: {
        dateTime: req.body.end.dateTime,
        timeZone: req.body.end.timeZone
      },
      allDay: req.body.allDay ?? false,
      googleCalendarEventId: req.body.googleCalendarEventId ?? null
    });

    return res.status(201).json({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      googleCalendarEventId: event.googleCalendarEventId
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An event with this id already exists' });
    }

    return res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
  }
);

router.patch(
  '/:id/google-id',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateGoogleCalendarEventIdValidator,
  validateRequest,
  async (req, res) => {
  if (!ensureMongoConnected(res)) {
    return;
  }

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { id: req.params.id },
      { googleCalendarEventId: req.body.googleCalendarEventId ?? null },
      { new: true, projection: { _id: 0 } }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.json(updatedEvent);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update Google Calendar event id', error: error.message });
  }
  }
);

export default router;
