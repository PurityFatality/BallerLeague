import mongoose from 'mongoose';

const eventDateTimeSchema = new mongoose.Schema(
  {
    dateTime: {
      type: String,
      required: true,
      trim: true
    },
    timeZone: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    start: {
      type: eventDateTimeSchema,
      required: true
    },
    end: {
      type: eventDateTimeSchema,
      required: true
    },
    allDay: {
      type: Boolean,
      default: false
    },
    googleCalendarEventId: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    collection: 'events',
    timestamps: true,
    versionKey: false
  }
);

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
