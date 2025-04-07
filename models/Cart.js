const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productName: String,
  image: String,
  platform: String,
  price: Number,
  quantity: { type: Number, default: 1 }
});

module.exports = mongoose.model('Cart', cartSchema);
