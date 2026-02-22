const express = require('express');
const router = express.Router();
const {
  createAdminSession,
  invalidateAdminSession,
  verifyAdminCredentials,
  requireAdminAuth
} = require('../middleware/adminAuth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!verifyAdminCredentials(username, password)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  }

  const token = createAdminSession();

  return res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      token,
      username
    }
  });
});

router.get('/me', requireAdminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      username: req.admin.username
    }
  });
});

router.post('/logout', requireAdminAuth, (req, res) => {
  invalidateAdminSession(req.admin.token);
  res.status(200).json({
    success: true,
    message: 'Logged out'
  });
});

module.exports = router;
