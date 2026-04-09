import { Router } from 'express';
import { requireAuth, requireAnyRole } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createTeamValidator,
  assignPlayerToTeamValidator,
  listTeamPlayersValidator
} from '../../validators/team.validators.js';
import { Team } from '../../models/team.model.js';
import { Player } from '../../models/player.model.js';

const router = Router();

router.get('/', async (req, res) => {
  const teams = await Team.find({}, { _id: 0 }).sort({ id: 1 });
  return res.json(teams);
});

router.post('/', requireAuth, requireAnyRole('league_admin', 'system_admin'), createTeamValidator, validateRequest, async (req, res) => {
  const last = await Team.findOne().sort({ id: -1 }).select('id');
  const nextMongoId = last ? Number(last.id) + 1 : 1;

  const team = await Team.create({
    id: nextMongoId,
    name: req.body.name,
    stadium: req.body.stadium ?? '',
    city: req.body.city ?? '',
    logo: req.body.logo ?? ''
  });

  return res.status(201).json({
    id: team.id,
    name: team.name,
    stadium: team.stadium,
    city: team.city,
    logo: team.logo
  });
});

router.post(
  '/:id/players',
  requireAuth,
  requireAnyRole('league_admin', 'system_admin'),
  assignPlayerToTeamValidator,
  validateRequest,
  async (req, res) => {
  const teamId = Number(req.params.id);
  const playerId = Number(req.body.player_id);
  const seasonId = Number(req.body.season_id);

  const team = await Team.findOne({ id: teamId });
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  const player = await Player.findOneAndUpdate(
    { id: playerId },
    { team_id: teamId, season_id: seasonId },
    { new: true, projection: { _id: 0 } }
  );

  if (!player) {
    return res.status(404).json({ message: 'Player not found' });
  }

  return res.status(201).json({
    success: true,
    team_id: Number(req.params.id),
    player_id: Number(req.body.player_id),
    season_id: Number(req.body.season_id)
  });
  }
);

router.get('/:id/players', listTeamPlayersValidator, validateRequest, async (req, res) => {
  const teamId = Number(req.params.id);
  const seasonId = req.query.season_id ? Number(req.query.season_id) : null;

  const filter = {
    team_id: teamId
  };

  if (seasonId) {
    filter.season_id = seasonId;
  }

  const players = await Player.find(filter, { _id: 0 }).sort({ id: 1 });
  return res.json(players);
});

export default router;
