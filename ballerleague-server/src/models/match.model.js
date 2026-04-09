import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1
    },
    season_id: {
      type: Number,
      required: true,
      min: 1
    },
    home_team_id: {
      type: Number,
      required: true,
      min: 1
    },
    away_team_id: {
      type: Number,
      required: true,
      min: 1
    },
    venue: {
      type: String,
      default: '',
      trim: true
    },
    kickoff_at: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'postponed', 'cancelled', 'completed'],
      default: 'scheduled'
    },
    status_note: {
      type: String,
      default: '',
      trim: true
    },
    published: {
      type: Boolean,
      default: false
    },
    created_by: {
      type: String,
      default: null
    }
  },
  {
    collection: 'matches',
    timestamps: true,
    versionKey: false
  }
);

matchSchema.index({ season_id: 1, kickoff_at: 1 });
matchSchema.index({ home_team_id: 1, away_team_id: 1, kickoff_at: 1 });

export const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
