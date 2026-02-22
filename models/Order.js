const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  basePrice: { type: Number, required: true },
  selectedOptions: [{
    groupId: String,
    groupName: String,
    choiceId: String,
    choiceLabel: String,
    priceDelta: { type: Number, default: 0 }
  }],
  priceVariant: {
    label: String,
    price: Number
  },
  itemTotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
  },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  pickupTime: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
