const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, isAdmin, isVisitor } = require('../middleware/auth');

router.get('/admin', authenticateToken, isAdmin, dashboardController.getAdminDashboard);
router.get('/visitor', authenticateToken, isVisitor, dashboardController.getVisitorDashboard);

module.exports = router;
