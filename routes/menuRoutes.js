const express = require('express');
const router = express.Router();
const {
  getMenu,
  getCategoryItems,
  searchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateItemAvailability,
  seedMenu
} = require('../controllers/menuController');
const { requireAdminAuth } = require('../middleware/adminAuth');

router.get('/', getMenu);
router.get('/category/:categoryId', getCategoryItems);
router.get('/search', searchMenu);
router.post('/item', requireAdminAuth, addMenuItem);
router.patch('/item/:itemId', requireAdminAuth, updateMenuItem);
router.patch('/item/:itemId/availability', requireAdminAuth, updateItemAvailability);
router.delete('/item/:itemId', requireAdminAuth, deleteMenuItem);
router.post('/seed', requireAdminAuth, seedMenu);

module.exports = router;
