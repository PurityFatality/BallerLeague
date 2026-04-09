import { Router } from 'express';
import { requireAuth, requireAnyRole } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { createPlayerValidator } from '../../validators/player.validators.js';
import { Player } from '../../models/player.model.js';

const router = Router();

router.get('/', async (req, res) => {
  const players = await Player.find({}, { _id: 0 }).sort({ id: 1 });
  return res.json(players);
});

router.post('/', requireAuth, requireAnyRole('league_admin', 'system_admin'), createPlayerValidator, validateRequest, async (req, res) => {
  const last = await Player.findOne().sort({ id: -1 }).select('id');
  const nextMongoId = last ? Number(last.id) + 1 : 1;

  const player = await Player.create({
    id: nextMongoId,
    name: req.body.name,
    team_id: req.body.team_id ? Number(req.body.team_id) : null,
    season_id: req.body.season_id ? Number(req.body.season_id) : null,
    position: req.body.position ?? '',
    number: Number(req.body.number ?? 0),
    nationality: req.body.nationality ?? '',
    avatar: req.body.avatar ?? '',
    apps: Number(req.body.apps ?? 0),
    goals: Number(req.body.goals ?? 0),
    assists: Number(req.body.assists ?? 0),
    rating: Number(req.body.rating ?? 0)
  });

  return res.status(201).json({
    id: player.id,
    name: player.name,
    team_id: player.team_id,
    season_id: player.season_id,
    position: player.position,
    number: player.number,
    nationality: player.nationality,
    avatar: player.avatar,
    apps: player.apps,
    goals: player.goals,
    assists: player.assists,
    rating: player.rating
  });
});

export default router;
