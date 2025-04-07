const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Cart = require('./models/Cart');
const path = require('path');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/shopcompare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: false }));

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  req.session.user = user;
  res.redirect('/dashboard');
});

app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.render('register', { error: 'User already exists' });
  const hashed = await bcrypt.hash(password, 10);
  await new User({ email, password: hashed }).save();
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const dummyProducts = [
    {
      name: 'iPhone 14',
      image: 'https://m.media-amazon.com/images/I/61cwywLZR-L._SX679_.jpg',
      prices: [
        { platform: 'Amazon', price: 79999, discount: 10 },
        { platform: 'Flipkart', price: 78999, discount: 12 }
      ],
      rating: 4.5,
      review: 'Excellent phone with great battery life.'
    },
    {
      name: 'Boat Airdopes 161',
      image: 'https://m.media-amazon.com/images/I/61KNJav3S9L._SX679_.jpg',
      prices: [
        { platform: 'Amazon', price: 999, discount: 30 },
        { platform: 'Flipkart', price: 950, discount: 35 }
      ],
      rating: 4.1,
      review: 'Best budget earbuds with solid bass.'
    }
  ];

  res.render('dashboard', {
    dummyProducts,
    user: req.session.user
  });
});

app.post('/add-to-cart', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { productName, image, platform, price } = req.body;
  let item = await Cart.findOne({ userId: req.session.user._id, productName, platform });
  if (item) {
    item.quantity += 1;
    await item.save();
  } else {
    await new Cart({
      userId: req.session.user._id,
      productName,
      image,
      platform,
      price,
      quantity: 1
    }).save();
  }
  res.redirect('/cart');
});

app.get('/cart', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const cartItems = await Cart.find({ userId: req.session.user._id });
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.render('cart', { cartItems, total });
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
