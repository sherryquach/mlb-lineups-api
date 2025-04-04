const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'secret123';

app.use(bodyParser.json());

// ✅ Authentication route
app.post('/api/authenticate', (req, res) => {
  const { name, password } = req.body;
  if (name === 'Admin' && password === 'qwerty1') {
    const token = jwt.sign({ name }, SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
});

// ✅ Scraper route
app.get('/api/lineupsFromTestPage', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    jwt.verify(token, SECRET);

    const { data } = await axios.get('https://www.rotowire.com/baseball/daily_lineups.htm', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html'
      }
    });

    const $ = cheerio.load(data);
    const games = [];

    $('.lineup.is-mlb').each((i, el) => {
      const time = $(el).find('.lineup__time').text().trim();
      const awayTeam = $(el).find('.lineup__team.is-visit .lineup__abbr').text().trim();
      const homeTeam = $(el).find('.lineup__team.is-home .lineup__abbr').text().trim();

      const extractPitcherInfo = (selector) => {
        const name = $(el).find(`${selector} li.lineup__player-highlight a`).first().text().trim();
        const throws = $(el).find(`${selector} li.lineup__player-highlight .lineup__throws`).first().text().trim();
        const status = $(el).find(`${selector} li.lineup__status`).first().text().trim();
        return { name, throws, status };
      };

      const extractLineup = (selector) => {
        const lineup = [];
        $(el).find(`${selector} li.lineup__player`).each((j, playerEl) => {
          const player = $(playerEl).find('a').attr('title')?.trim();
          const position = $(playerEl).find('.lineup__pos').text().trim();
          const bats = $(playerEl).find('.lineup__bats').text().trim();
          if (player && position) {
            lineup.push({ player, position, bats });
          }
        });
        return lineup;
      };

      if (time && awayTeam && homeTeam) {
        games.push({
          time,
          away: {
            name: awayTeam,
            pitcher: extractPitcherInfo('.lineup__list.is-visit'),
            lineup: extractLineup('.lineup__list.is-visit')
          },
          home: {
            name: homeTeam,
            pitcher: extractPitcherInfo('.lineup__list.is-home'),
            lineup: extractLineup('.lineup__list.is-home')
          }
        });
      }
    });

    res.json(games);
  } catch (err) {
    console.error('Scraper error:', err.message);
    res.status(500).json({ error: 'Scraping failed or token invalid' });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
