const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { forwardRequest } = require('../utils/serviceClient');

/**
 * =====================================================================
 *  DRIVER PROFILE ROUTES
 * =====================================================================
 */

// POST /api/drivers/register (Protected)
router.post('/api/drivers/register', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'POST', '/api/drivers/register/');
});

// GET /api/drivers/me/profile (Protected)
router.get('/api/drivers/me/profile', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'GET', '/api/drivers/me/profile/');
});

// GET /api/drivers/:driver_id/profile (Public - Get driver by ID)
router.get('/api/drivers/:driver_id/profile', async (req, res) => {
  await forwardRequest(req, res, 'GET', `/api/drivers/${req.params.driver_id}/profile/`);
});

// PUT /api/drivers/me/status (Protected)
router.put('/api/drivers/me/status', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'PUT', '/api/drivers/me/status/');
});

// PATCH /api/drivers/:driver_id/stats (Protected)
router.patch('/api/drivers/:driver_id/stats', authenticateToken, async (req, res) => {
  await forwardRequest(req, res, 'PATCH', `/api/drivers/${req.params.driver_id}/stats/`);
});

module.exports = router;

