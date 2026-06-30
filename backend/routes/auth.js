import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../firebase.js';
import authMiddleware from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'zenith_secret_jwt_2026_key';

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const emailClean = email.trim().toLowerCase();
    
    // Check if user already exists
    const userQuery = await db.collection('users').where('email', '==', emailClean).get();
    if (!userQuery.empty) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create unique userId
    const userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);

    const userProfile = {
      uid: userId,
      name: name.trim(),
      email: emailClean,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`,
      tier: 'Free',
      createdAt: new Date().toISOString()
    };

    // Save user profile + password hash
    await db.collection('users').doc(userId).set({
      ...userProfile,
      passwordHash
    });

    // Generate JWT
    const token = jwt.sign({ userId, email: emailClean }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const emailClean = email.trim().toLowerCase();

    // Query user
    const userQuery = await db.collection('users').where('email', '==', emailClean).get();
    if (userQuery.empty) {
      return res.status(400).json({ message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Get user document
    let userDoc = null;
    userQuery.forEach(doc => {
      userDoc = { id: doc.id, ...doc.data() };
    });

    // Check password
    const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: userDoc.id, email: emailClean }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password hash from response
    const { passwordHash: _passwordHash, ...userProfile } = userDoc;

    res.status(200).json({
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET AUTH CONFIG
router.get('/config', (req, res) => {
  res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

// POST AUTH CONFIG
router.post('/config', async (req, res) => {
  try {
    const { googleClientId } = req.body;
    if (!googleClientId || !googleClientId.trim()) {
      return res.status(400).json({ message: 'Google Client ID is required.' });
    }

    const trimmedId = googleClientId.trim();
    process.env.GOOGLE_CLIENT_ID = trimmedId;

    // Read and update the .env file
    const envPath = path.resolve('.env');
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      // file might not exist or be readable
    }

    const newLines = [];
    let updated = false;
    const lines = envContent.split(/\r?\n/);
    for (let line of lines) {
      if (line.startsWith('GOOGLE_CLIENT_ID=')) {
        newLines.push(`GOOGLE_CLIENT_ID=${trimmedId}`);
        updated = true;
      } else {
        newLines.push(line);
      }
    }

    if (!updated) {
      newLines.push(`GOOGLE_CLIENT_ID=${trimmedId}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');

    res.status(200).json({
      message: 'Google Client ID saved successfully. Server environment updated.',
      googleClientId: trimmedId
    });
  } catch (err) {
    console.error('Failed to update config:', err);
    res.status(500).json({ message: 'Failed to update Google Client ID on the server.' });
  }
});

// GOOGLE SIGNUP / LOGIN (REAL AND MOCK)
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    let email, name, avatarUrl;
    
    if (credential) {
      // Verify token with Google's API
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!verifyRes.ok) {
        return res.status(400).json({ message: 'Google authentication token verification failed.' });
      }
      const tokenInfo = await verifyRes.json();
      email = tokenInfo.email;
      name = tokenInfo.name;
      avatarUrl = tokenInfo.picture;
    } else {
      // Fallback mock flow if no token is sent (client ID not configured)
      email = req.body.email;
      name = req.body.name;
      avatarUrl = req.body.avatarUrl;
    }

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google Account.' });
    }

    let userId = null;
    let userProfile = null;

    const emailClean = email.toLowerCase().trim();
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', emailClean).limit(1).get();

    if (userQuery.empty) {
      // Create new user document
      const newUserRef = usersRef.doc();
      userId = newUserRef.id;
      userProfile = {
        id: userId,
        email: emailClean,
        name: name || 'Google User',
        avatarUrl: avatarUrl || '',
        createdAt: new Date().toISOString(),
        tier: 'Free',
        focusTimeMinutes: 0,
        focusTargetMinutes: 240
      };
      await newUserRef.set(userProfile);
    } else {
      // Get user document
      let userDoc = null;
      userQuery.forEach(doc => {
        userDoc = { id: doc.id, ...doc.data() };
      });
      userId = userDoc.id;
      const { passwordHash: _passwordHash, ...profile } = userDoc;
      userProfile = profile;
    }

    // Generate JWT
    const token = jwt.sign({ userId, email: emailClean }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Internal server error during Google authentication.' });
  }
});

// GET PROFILE
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { passwordHash: _passwordHash, ...userProfile } = userDoc.data();
    res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ message: 'Internal server error while fetching profile.' });
  }
});


export default router;
