const Menu = require('../models/Menu');

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeTags = (tags) =>
  Array.isArray(tags)
    ? tags
    : String(tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

const normalizePriceVariants = (priceVariants) => {
  if (!Array.isArray(priceVariants)) {
    return [];
  }

  return priceVariants
    .map((variant) => ({
      label: String(variant?.label || '').trim(),
      price: Number(variant?.price)
    }))
    .filter((variant) => variant.label && !Number.isNaN(variant.price) && variant.price >= 0);
};

const findMenuItem = (menu, itemId) => {
  for (const category of menu.categories) {
    const item = category.items.find((existingItem) => existingItem.id === itemId);
    if (item) {
      return { category, item };
    }
  }
  return null;
};

// Get complete menu
exports.getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get items by category
exports.getCategoryItems = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu not found' 
      });
    }
    
    const category = menu.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Search menu items
exports.searchMenu = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const menu = await Menu.findOne();
    const results = [];
    
    menu.categories.forEach(category => {
      const matchedItems = category.items.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        item.description.toLowerCase().includes(q.toLowerCase())
      );
      
      if (matchedItems.length > 0) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          items: matchedItems
        });
      }
    });
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update item availability (Admin)
exports.updateItemAvailability = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { available } = req.body;
    
    const menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }
    
    let itemFound = false;
    
    menu.categories.forEach(category => {
      const item = category.items.find(item => item.id === itemId);
      if (item) {
        item.available = available;
        itemFound = true;
      }
    });
    
    if (!itemFound) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    await menu.save();
    
    res.status(200).json({
      success: true,
      message: 'Item availability updated',
      data: { itemId, available }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Seed menu from JSON (one-time setup)
exports.seedMenu = async (req, res) => {
  try {
    // Delete existing menu
    await Menu.deleteMany({});
    
    // Create new menu from request body
    const menu = await Menu.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Menu seeded successfully',
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Add a new menu item under a category (Admin)
exports.addMenuItem = async (req, res) => {
  try {
    const {
      categoryId,
      categoryName,
      itemId,
      name,
      description,
      price,
      image,
      tags,
      available,
      priceVariants
    } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Item name and price are required'
      });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid non-negative number'
      });
    }

    const menu = await Menu.findOne();
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    const normalizedCategoryId = categoryId || toSlug(categoryName);
    if (!normalizedCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    let category = menu.categories.find((cat) => cat.id === normalizedCategoryId);
    if (!category) {
      category = menu.categories.create({
        id: normalizedCategoryId,
        name: categoryName || normalizedCategoryId,
        description: ''
      });
      menu.categories.push(category);
    }

    const generatedItemId = itemId || `${toSlug(name)}-${Date.now()}`;
    const itemExists = menu.categories.some((cat) =>
      cat.items.some((item) => item.id === generatedItemId)
    );

    if (itemExists) {
      return res.status(400).json({
        success: false,
        message: 'Item id already exists. Provide a unique itemId.'
      });
    }

    const newItem = {
      id: generatedItemId,
      name,
      description: description || '',
      price: numericPrice,
      image: image || '',
      tags: normalizeTags(tags),
      available: available !== false,
      categoryId: normalizedCategoryId,
      options: [],
      priceVariants: normalizePriceVariants(priceVariants)
    };

    category.items.push(newItem);
    await menu.save();

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        categoryId: normalizedCategoryId,
        item: newItem
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update an existing menu item (Admin)
exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      name,
      description,
      price,
      image,
      tags,
      available,
      priceVariants
    } = req.body;

    const menu = await Menu.findOne();
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    const found = findMenuItem(menu, itemId);
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const { item } = found;

    if (name !== undefined) {
      item.name = name;
    }
    if (description !== undefined) {
      item.description = description;
    }
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid non-negative number'
        });
      }
      item.price = numericPrice;
    }
    if (image !== undefined) {
      item.image = image;
    }
    if (tags !== undefined) {
      item.tags = normalizeTags(tags);
    }
    if (available !== undefined) {
      item.available = Boolean(available);
    }
    if (priceVariants !== undefined) {
      item.priceVariants = normalizePriceVariants(priceVariants);
    }

    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete a menu item (Admin)
exports.deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const menu = await Menu.findOne();

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    let deleted = false;

    menu.categories.forEach((category) => {
      const initialLength = category.items.length;
      category.items = category.items.filter((item) => item.id !== itemId);
      if (category.items.length < initialLength) {
        deleted = true;
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: { itemId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
