const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auth_demo', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));

// Models
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Routes
app.get('/', (req, res) => {
  res.send('Home Page');
});

app.get('/register', (req, res) => {
  res.send('Registration Page');
});

app.post('/register', [
  check('username').isEmail(),
  check('password').isLength({ min: 5 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    const user = new User({ username, password: hash });
    user.save((err) => {
      if (err) throw err;
      res.send('Registration successful!');
    });
  });
});

app.get('/login', (req, res) => {
  res.send('Login Page');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username }, (err, user) => {
    if (err) throw err;

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) throw err;

      if (result) {
        req.session.user = user;
        res.send('Login successful!');
      } else {
        res.status(401).send('Invalid username or password');
      }
    });
  });
});

app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.send('Profile Page');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
