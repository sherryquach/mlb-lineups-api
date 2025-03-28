const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'secret123';

app.use(bodyParser.json());


app.get('/api/lineupsFromTestPage', async (req, res) => {
  const token = req.headers['x-access-token'];
  const SECRET = process.env.JWT_SECRET || 'secret123';

  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    jwt.verify(token, SECRET);

    const { data } = await axios.get('https://www.rotowire.com/baseball/daily_lineups.htm');
    const $ = cheerio.load(data);

    const games = [];

    $('.lineup__matchup').each((i, el) => {
      const time = $(el).find('.lineup__time').text().trim();

      const awayTeam = $(el).find('.lineup__team--away .lineup__abbr').text().trim();
      const awayLineup = [];
      $(el).find('.lineup__team--away ul.lineup__list li').each((j, playerEl) => {
        const player = $(playerEl).find('.lineup__player-name').text().trim();
        const position = $(playerEl).find('.lineup__pos').text().trim();
        awayLineup.push({ player, position });
      });

      const homeTeam = $(el).find('.lineup__team--home .lineup__abbr').text().trim();
      const homeLineup = [];
      $(el).find('.lineup__team--home ul.lineup__list li').each((j, playerEl) => {
        const player = $(playerEl).find('.lineup__player-name').text().trim();
        const position = $(playerEl).find('.lineup__pos').text().trim();
        homeLineup.push({ player, position });
      });

      games.push({
        time,
        away: { name: awayTeam, lineup: awayLineup },
        home: { name: homeTeam, lineup: homeLineup }
      });
    });

    res.json({ games });

  } catch (err) {
    console.error('Scraper error:', err.message);
    res.status(500).json({ error: 'Scraping failed or token invalid' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
