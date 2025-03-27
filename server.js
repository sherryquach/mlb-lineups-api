const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'secret123';

app.use(bodyParser.json());

// Fake user for demo
const user = { name: 'Admin', password: 'qwerty1' };

// Authentication route
app.post('/api/authenticate', (req, res) => {
  const { name, password } = req.body;
  if (name === user.name && password === user.password) {
    const token = jwt.sign({ name }, SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
});

// Protected route (your lineup data can go here)
app.get('/api/lineupsFromTestPage', (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

    // Sample data response
    res.json({
      games: [
        {
          time: '3:10 PM ET',
          away: { name: 'St. Louis Cardinals', lineup: [{ player: 'Matt Carpenter', position: '1B' }] },
          home: { name: 'Colorado Rockies', lineup: [{ player: 'Charlie Blackmon', position: 'CF' }] }
        }
      ]
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
