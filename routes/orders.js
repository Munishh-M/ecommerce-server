const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @POST /api/orders/create-payment-intent
router.post('/create-payment-intent', protect, async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses paise/cents
      currency: 'inr',
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/orders — create order after payment success
router.post('/', protect, async (req, res) => {
  const { items, totalAmount, address, phone } = req.body;
  try {
    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount,
      address,
      phone,
      paymentStatus: 'paid'
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/orders/my-orders — customer's own orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name imageUrl')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;