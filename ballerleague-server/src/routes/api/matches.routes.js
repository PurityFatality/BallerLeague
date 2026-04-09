import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAnyRole } from '../../middleware/auth.js';
import { Match } from '../../models/match.model.js';
import { Team } from '../../models/team.model.js';
import { Season } from '../../models/season.model.js';
import {
  createManualMatchValidator,
  matchIdParamValidator,
  publishMatchValidator,
  publishScheduleValidator,
  updateMatchScheduleValidator,
  updateMatchStatusValidator
} from '../../validators/match.validators.js';

const router = Router();

async function enrichMatches(matchDocs) {
  const matches = matchDocs.map((item) => (typeof item.toObject === 'function' ? item.toObject() : item));
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const teams = await Team.find({ id: { $in: teamIds } }, { _id: 0, id: 1, name: 1 }).lean();
  const teamMap = new Map(teams.map((team) => [team.id, team.name]));

  return matches.map((match) => ({
    ...match,
    home_team_name: teamMap.get(match.home_team_id) || `Team ${match.home_team_id}`,
    away_team_name: teamMap.get(match.away_team_id) || `Team ${match.away_team_id}`
  }));
}

router.get('/admin/all', requireAuth, requireAnyRole('league_admin', 'system_admin'), async (req, res) => {
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = seasonId ? { season_id: seasonId } : {};
  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: 1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/upcoming', async (req, res) => {
  const now = new Date();
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = {
    published: true,
    status: { $in: ['scheduled', 'postponed'] },
    kickoff_at: { $gte: now }
  };

  if (seasonId) {
    filter.season_id = seasonId;
  }

  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: 1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/past', async (req, res) => {
  const now = new Date();
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;
  const filter = {
    published: true,
    $or: [{ kickoff_at: { $lt: now } }, { status: { $in: ['completed', 'cancelled'] } }]
  };

  if (seasonId) {
    filter.season_id = seasonId;
  }

  const matches = await Match.find(filter, { _id: 0 }).sort({ kickoff_at: -1 });
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get('/:id', matchIdParamValidator, validateRequest, async (req, res) => {
  const matchId = Number(req.params.id);
  const match = await Match.findOne({ id: matchId }, { _id: 0 });

  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }

  const [enriched] = await enrichMatches([match]);
  return res.json(enriched);
});

router.post(
  '/manual',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  createManualMatchValidator,
  validateRequest,
  async (req, res) => {
    const seasonId = Number(req.body.season_id);
    const homeTeamId = Number(req.body.home_team_id);
    const awayTeamId = Number(req.body.away_team_id);

    const [season, homeTeam, awayTeam] = await Promise.all([
      Season.findOne({ id: seasonId }).select('id'),
      Team.findOne({ id: homeTeamId }).select('id'),
      Team.findOne({ id: awayTeamId }).select('id')
    ]);

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({ message: 'Home or away team not found' });
    }

    const last = await Match.findOne().sort({ id: -1 }).select('id');
    const nextMatchId = last ? Number(last.id) + 1 : 1;

    const created = await Match.create({
      id: nextMatchId,
      season_id: seasonId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      venue: req.body.venue ?? '',
      kickoff_at: new Date(req.body.kickoff_at),
      published: req.body.published ?? false,
      created_by: req.auth?.sub || null
    });

    const [enriched] = await enrichMatches([created]);
    return res.status(201).json(enriched);
  }
);

router.patch(
  '/:id/schedule',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateMatchScheduleValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updates = {};

    if (req.body.kickoff_at) {
      updates.kickoff_at = new Date(req.body.kickoff_at);
    }

    if (typeof req.body.venue === 'string') {
      updates.venue = req.body.venue;
    }

    if (typeof req.body.season_id !== 'undefined') {
      const seasonId = Number(req.body.season_id);
      const season = await Season.findOne({ id: seasonId }).select('id');
      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }
      updates.season_id = seasonId;
    }

    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      updates,
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/status',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  updateMatchStatusValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      {
        status: req.body.status,
        status_note: req.body.status_note ?? ''
      },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  publishMatchValidator,
  validateRequest,
  async (req, res) => {
    const matchId = Number(req.params.id);
    const updated = await Match.findOneAndUpdate(
      { id: matchId },
      { published: req.body.published },
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const [enriched] = await enrichMatches([updated]);
    return res.json(enriched);
  }
);

router.post(
  '/publish',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  publishScheduleValidator,
  validateRequest,
  async (req, res) => {
    const seasonId = req.body.season_id ? Number(req.body.season_id) : null;
    const published = typeof req.body.published === 'boolean' ? req.body.published : true;

    const filter = seasonId ? { season_id: seasonId } : {};
    const result = await Match.updateMany(filter, { published });

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      published,
      season_id: seasonId
    });
  }
);

export default router;
