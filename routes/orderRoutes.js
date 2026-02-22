const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { requireAdminAuth } = require('../middleware/adminAuth');

router.post('/', createOrder);
router.get('/', requireAdminAuth, getAllOrders);
router.get('/:id', requireAdminAuth, getOrder);
router.patch('/:id/status', requireAdminAuth, updateOrderStatus);

module.exports = router;
