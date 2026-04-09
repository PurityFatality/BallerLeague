import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAnyRole, signAccessToken } from '../../middleware/auth.js';
import {
  bootstrapAdminValidator,
  loginValidator,
  registerValidator,
  updateOwnProfileValidator,
  updateUserRolesValidator,
  updateUserStatusValidator
} from '../../validators/auth.validators.js';
import { User } from '../../models/user.model.js';

const router = Router();

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    displayName: userDoc.displayName,
    roles: userDoc.roles,
    participantType: userDoc.participantType,
    active: userDoc.active,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt
  };
}

function buildTokenPayload(userDoc) {
  return {
    sub: userDoc._id.toString(),
    email: userDoc.email,
    displayName: userDoc.displayName,
    roles: userDoc.roles,
    participantType: userDoc.participantType
  };
}

router.post('/bootstrap-admin', bootstrapAdminValidator, validateRequest, async (req, res) => {
  const configuredKey = process.env.AUTH_BOOTSTRAP_KEY;
  if (!configuredKey) {
    return res.status(403).json({ message: 'AUTH_BOOTSTRAP_KEY is not configured on this server' });
  }

  if (req.body.bootstrapKey !== configuredKey) {
    return res.status(403).json({ message: 'Invalid bootstrap key' });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextRoles = [...new Set([...(user.roles || []), 'system_admin'])];
  user.roles = nextRoles;
  await user.save();

  return res.json({ user: sanitizeUser(user) });
});

router.post('/register', registerValidator, validateRequest, async (req, res) => {
  const existing = await User.findOne({ email: req.body.email }).select('_id');
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const usersCount = await User.estimatedDocumentCount();
  if (usersCount === 0) {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      email: req.body.email,
      displayName: req.body.displayName,
      passwordHash,
      roles: ['system_admin'],
      participantType: null
    });

    const token = signAccessToken(buildTokenPayload(user));
    return res.status(201).json({
      token,
      user: sanitizeUser(user),
      bootstrap: 'First account created as system_admin'
    });
  }

  const requestedRoles = Array.isArray(req.body.roles) ? req.body.roles : [];
  const roles = requestedRoles.filter((role) => role === 'participant' || role === 'public_user');
  const finalRoles = roles.length ? [...new Set(roles)] : ['public_user'];
  const participantType = finalRoles.includes('participant') ? req.body.participantType ?? null : null;

  if (finalRoles.includes('participant') && !participantType) {
    return res.status(400).json({ message: 'participantType is required when role includes participant' });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    email: req.body.email,
    displayName: req.body.displayName,
    passwordHash,
    roles: finalRoles,
    participantType
  });

  const token = signAccessToken(buildTokenPayload(user));
  return res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post('/login', loginValidator, validateRequest, async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.active) {
    return res.status(403).json({ message: 'This account is disabled. Contact a system admin.' });
  }

  const passwordOk = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signAccessToken(buildTokenPayload(user));
  return res.json({ token, user: sanitizeUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
});

router.patch('/me/profile', requireAuth, updateOwnProfileValidator, validateRequest, async (req, res) => {
  const updates = {};

  if (typeof req.body.displayName === 'string') {
    updates.displayName = req.body.displayName.trim();
  }

  if (typeof req.body.participantType !== 'undefined') {
    if (!(req.auth.roles || []).includes('participant')) {
      return res.status(403).json({ message: 'Only participants can update participantType' });
    }

    updates.participantType = req.body.participantType;
  }

  const user = await User.findByIdAndUpdate(req.auth.sub, updates, { new: true });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
});

router.get('/users', requireAuth, requireAnyRole('system_admin'), async (req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  return res.json(users.map((user) => sanitizeUser(user)));
});

router.patch(
  '/users/:id/roles',
  requireAuth,
  requireAnyRole('system_admin'),
  updateUserRolesValidator,
  validateRequest,
  async (req, res) => {
    const roles = [...new Set(req.body.roles)];
    const participantType = roles.includes('participant') ? req.body.participantType ?? null : null;

    if (roles.includes('participant') && !participantType) {
      return res.status(400).json({ message: 'participantType is required when assigning participant role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        roles,
        participantType
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: sanitizeUser(user) });
  }
);

router.patch(
  '/users/:id/status',
  requireAuth,
  requireAnyRole('system_admin'),
  updateUserStatusValidator,
  validateRequest,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: sanitizeUser(user) });
  }
);

export default router;
