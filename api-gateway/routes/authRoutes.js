const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { forwardRequest } = require('../utils/serviceClient');

/**
 * =====================================================================
 *  AUTHENTICATION ROUTES
 * =====================================================================
 */

// POST /api/auth/register (Public)
router.post('/api/auth/register', async (req, res) => {
  await forwardRequest(req, res, 'POST', '/api/auth/register/');
});

// POST /api/auth/login (Public)
router.post('/api/auth/login', async (req, res) => {
  await forwardRequest(req, res, 'POST', '/api/auth/login/');
});

// POST /api/auth/refresh-token (Public)
router.post('/api/auth/refresh-token', async (req, res) => {
  await forwardRequest(req, res, 'POST', '/api/auth/refresh-token/');
});

// GET /api/auth/me (Protected)
router.get('/api/auth/me', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'GET', '/api/auth/me/');
});

// POST /api/auth/logout (Protected)
router.post('/api/auth/logout', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'POST', '/api/auth/logout/');
});

// GET /api/auth/:user_id (Public - Get user by ID)
router.get('/api/auth/:user_id', async (req, res) => {
  await forwardRequest(req, res, 'GET', `/api/auth/${req.params.user_id}/`);
});

module.exports = router;