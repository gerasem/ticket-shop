import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const dbPath = join(__dirname, 'venue.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create Venues Table
    db.run(`CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      width INTEGER,
      height INTEGER
    )`);

    // Create Seats Table
    db.run(`CREATE TABLE IF NOT EXISTS seats (
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
    db.get("SELECT count(*) as count FROM venues", (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      if (row.count === 0) {
        console.log('Seeding database...');
        seedDatabase();
      }
    });
  });
}

function seedDatabase() {
  const venueId = 'venue-1';
  
  // Insert Venue
  const venueStmt = db.prepare("INSERT INTO venues (id, name, type, width, height) VALUES (?, ?, ?, ?, ?)");
  venueStmt.run(venueId, 'Grand Cinema Hall 1', 'cinema', 800, 600);
  venueStmt.finalize();

  // Insert Seats (Logic copied from mockData.ts)
  const rows = 10;
  const cols = 15;
  const seatSize = 40;
  const gap = 10;
  const PRICE_FRONT = 1500;
  const PRICE_MIDDLE = 1200;
  const PRICE_BACK = 1800;

  const seatStmt = db.prepare("INSERT INTO seats (id, venue_id, x, y, status, label, priceInCents) VALUES (?, ?, ?, ?, ?, ?, ?)");

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
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
        
        seatStmt.run(id, venueId, x, y, status, label, price);
      }
    }
    db.run("COMMIT", () => {
      console.log('Database seeded successfully.');
    });
    seatStmt.finalize();
  });
}

// API Endpoints

// Get Venue Data
app.get('/api/venue', (req, res) => {
  const venueId = 'venue-1'; // Single venue for now
  
  db.get("SELECT * FROM venues WHERE id = ?", [venueId], (err, venue) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!venue) {
      res.status(404).json({ error: 'Venue not found' });
      return;
    }

    db.all("SELECT * FROM seats WHERE venue_id = ?", [venueId], (err, seats) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...venue, seats });
    });
  });
});

// Update Seat Status
app.post('/api/venue/seat/:id', (req, res) => {
  const seatId = req.params.id;
  const { status } = req.body;

  if (!['free', 'booked', 'readyToBook'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  db.run("UPDATE seats SET status = ? WHERE id = ?", [status, seatId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }
    res.json({ message: 'Seat updated', id: seatId, status });
  });
});

// Reset Database (Dev Tool)
app.post('/api/venue/reset', (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM seats");
    db.run("DELETE FROM venues");
    seedDatabase();
    res.json({ message: 'Database reset' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
