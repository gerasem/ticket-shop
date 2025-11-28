import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = join(__dirname, 'venue_v2.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Promise wrappers for SQLite
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function initializeDatabase() {
  try {
    // Create Venues Table
    await dbRun(`CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      width INTEGER,
      height INTEGER,
      stage_x INTEGER,
      stage_y INTEGER,
      stage_width INTEGER,
      stage_height INTEGER
    )`);

    // Create Seats Table
    await dbRun(`CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      venue_id TEXT,
      x INTEGER,
      y INTEGER,
      status TEXT,
      label TEXT,
      priceInCents INTEGER,
      FOREIGN KEY(venue_id) REFERENCES venues(id)
    )`);

    // Check if data exists, if not seed it
    const row = await dbGet("SELECT count(*) as count FROM venues");
    if (row.count === 0) {
      console.log('Seeding database...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

async function seedDatabase() {
  const venueId = 'venue-1';
  
  try {
    // Insert Venue
    await dbRun("INSERT INTO venues (id, name, type, width, height, stage_x, stage_y, stage_width, stage_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [venueId, 'Grand Cinema Hall 1', 'cinema', 800, 600, 100, 20, 600, 40]);

    // Insert Seats (Logic copied from mockData.ts)
    const rows = 10;
    const cols = 15;
    const seatSize = 40;
    const gap = 10;
    const PRICE_FRONT = 1500;
    const PRICE_MIDDLE = 1200;
    const PRICE_BACK = 1800;

    await dbRun("BEGIN TRANSACTION");

    for (let r = 0; r < rows; r++) {
      let price;
      if (r < 2) price = PRICE_FRONT;
      else if (r >= rows - 2) price = PRICE_BACK;
      else price = PRICE_MIDDLE;

      for (let c = 0; c < cols; c++) {
        const id = `r${r}-c${c}`;
        const x = c * (seatSize + gap) + 50;
        const y = r * (seatSize + gap) + 50;
        const status = Math.random() > 0.8 ? 'booked' : 'free';
        const label = `${r + 1}-${c + 1}`;
        
        await dbRun("INSERT INTO seats (id, venue_id, x, y, status, label, priceInCents) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [id, venueId, x, y, status, label, price]);
      }
    }
    
    await dbRun("COMMIT");
    console.log('Database seeded successfully.');
  } catch (err) {
    await dbRun("ROLLBACK");
    console.error('Seeding error:', err);
  }
}

// API Endpoints

// Get Venue Data
app.get('/api/venue', async (req, res) => {
  const venueId = 'venue-1'; // Single venue for now
  
  try {
    const venue = await dbGet("SELECT * FROM venues WHERE id = ?", [venueId]);
    if (!venue) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    const seats = await dbAll("SELECT * FROM seats WHERE venue_id = ?", [venueId]);
    
    // Construct stage object from flat columns
    const venueWithStage = {
      ...venue,
      stage: {
        x: venue.stage_x,
        y: venue.stage_y,
        width: venue.stage_width,
        height: venue.stage_height
      }
    };
    
    // Remove flat stage columns if desired, or keep them. 
    // For cleanliness, let's remove them from the root object if we want to match the interface exactly, 
    // but keeping them doesn't usually hurt.
    // Let's just return the structured object.
    
    res.json({ ...venueWithStage, seats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Seat Status
app.post('/api/venue/seat/:id', async (req, res) => {
  const seatId = req.params.id;
  const { status } = req.body;

  if (!['free', 'booked', 'readyToBook'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const result = await dbRun("UPDATE seats SET status = ? WHERE id = ?", [status, seatId]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }
    res.json({ message: 'Seat updated', id: seatId, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shift All Seats (Fix Layout)
app.post('/api/venue/shift-seats', async (req, res) => {
  const { shiftY } = req.body;
  const venueId = 'venue-1';

  if (typeof shiftY !== 'number') {
    res.status(400).json({ error: 'Invalid shiftY' });
    return;
  }

  try {
    const result = await dbRun("UPDATE seats SET y = y + ? WHERE venue_id = ?", [shiftY, venueId]);
    res.json({ message: 'Seats shifted', changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Database (Dev Tool)
app.post('/api/venue/reset', async (req, res) => {
  try {
    await dbRun("DELETE FROM seats");
    await dbRun("DELETE FROM venues");
    await seedDatabase();
    res.json({ message: 'Database reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
