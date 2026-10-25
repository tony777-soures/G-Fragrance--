const path = require('path');
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const publicDir = __dirname;
const db = new Database(path.join(__dirname, 'gfragrance.db'));

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    accepted_terms_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-before-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

function makeBaseUsername(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  return base;
}

function createUniqueUsername(name) {
  const base = makeBaseUsername(name);
  let username = base;
  let count = 1;
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?');

  while (exists.get(username)) {
    count += 1;
    username = `${base}${count}`;
  }
  return username;
}

function normalize(value) {
  return String(value || '').trim();
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = normalize(req.body.name);
    const email = normalize(req.body.email).toLowerCase();
    const phone = normalize(req.body.phone);
    const password = String(req.body.password || '');
    const terms = req.body.terms === true || req.body.terms === 'true' || req.body.terms === 'on';

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please complete all required fields.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (!terms) {
      return res.status(400).json({ message: 'You must agree to the Terms & Conditions.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const username = createUniqueUsername(name);
    const passwordHash = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (name, username, email, phone, password_hash, accepted_terms_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, username, email, phone, passwordHash, new Date().toISOString());

    return res.status(201).json({
      message: 'Account created successfully.',
      username
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong while creating the account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const name = normalize(req.body.name);
    const username = normalize(req.body.username).toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Please enter your name, username and password.' });
    }

    const user = db.prepare(`
      SELECT id, name, username, email, phone, password_hash
      FROM users
      WHERE username = ?
    `).get(username);

    if (!user || user.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(401).json({ message: 'Name or username is incorrect.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Password is incorrect.' });
    }

    req.session.userId = user.id;

    return res.json({
      message: 'Login successful.',
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });

  const user = db.prepare(`
    SELECT id, name, username, email, phone, created_at
    FROM users WHERE id = ?
  `).get(req.session.userId);

  if (!user) return res.status(401).json({ message: 'Account not found.' });
  return res.json({ user });
});

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`G-Fragrance is running at http://localhost:${PORT}`);
});
