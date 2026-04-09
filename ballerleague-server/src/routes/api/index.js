import { Router } from 'express';
import authRoutes from './auth.routes.js';
import leaguesRoutes from './leagues.routes.js';
import seasonsRoutes from './seasons.routes.js';
import teamsRoutes from './teams.routes.js';
import playersRoutes from './players.routes.js';
import eventsRoutes from './events.routes.js';
import matchesRoutes from './matches.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leagues', leaguesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/teams', teamsRoutes);
router.use('/players', playersRoutes);
router.use('/events', eventsRoutes);
router.use('/matches', matchesRoutes);

export default router;
