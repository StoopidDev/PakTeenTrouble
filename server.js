const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'clicks.json');

const CLASSROOMS = [
  '7/1','7/2','7/3','7/4',
  '8/1','8/2','8/3','8/4',
  '9/1','9/2','9/3','9/4',
  '10/1','10/2','10/3','10/4',
  '11/1','11/2'
];

// Load or init the data file
function loadData() {
  if (fs.existsSync(DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (_) {}
  }
  const fresh = {};
  for (const c of CLASSROOMS) fresh[c] = 0;
  return fresh;
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Ensure all classrooms exist
let db = loadData();
for (const c of CLASSROOMS) if (!(c in db)) db[c] = 0;
saveData(db);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// GET leaderboard — sorted highest first
app.get('/api/leaderboard', (req, res) => {
  db = loadData();
  const rows = CLASSROOMS
    .map(c => ({ classroom: c, count: db[c] || 0 }))
    .sort((a, b) => b.count - a.count);
  res.json(rows);
});

// POST click — batch-safe, capped at 100 per request
app.post('/api/click', (req, res) => {
  const { classroom, amount } = req.body;
  if (!CLASSROOMS.includes(classroom)) {
    return res.status(400).json({ error: 'Invalid classroom' });
  }
  const n = Math.max(parseInt(amount) || 1, 1);
  db = loadData();
  db[classroom] = (db[classroom] || 0) + n;
  saveData(db);
  res.json({ classroom, count: db[classroom] });
});

app.listen(PORT, () => {
  console.log(`Teen's Trouble running at http://localhost:${PORT}`);
});
