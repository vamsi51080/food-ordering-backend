const mongoose = require('mongoose');

const choiceSchema = new mongoose.Schema({
  id: String,
  label: String,
  priceDelta: { type: Number, default: 0 }
});

const optionGroupSchema = new mongoose.Schema({
  groupId: String,
  groupName: String,
  required: { type: Boolean, default: false },
  type: { type: String, enum: ['single', 'multiple', 'toggle'] },
  choices: [choiceSchema],
  choicesRef: String
});

const priceVariantSchema = new mongoose.Schema({
  label: String,
  price: Number
});

const menuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  options: [optionGroupSchema],
  priceVariants: [priceVariantSchema],
  tags: [String],
  available: { type: Boolean, default: true },
  categoryId: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  items: [menuItemSchema]
}, { timestamps: true });

const globalOptionsSchema = new mongoose.Schema({
  breads: [choiceSchema],
  sauces: [choiceSchema],
  dipExtra: choiceSchema
});

const storeInfoSchema = new mongoose.Schema({
  name: String,
  tagline: String,
  addressLine1: String,
  cityStateZip: String,
  phone: String,
  pickupNote: String
});

const menuSchema = new mongoose.Schema({
  store: storeInfoSchema,
  globalOptions: globalOptionsSchema,
  categories: [categorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);
