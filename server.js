// Simple Express server with SQLite integration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
defaultDbInit();

function defaultDbInit() {
  const db = new sqlite3.Database('demo.db');
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )`);
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (!err && row.count === 0) {
        db.run(`INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')`);
        db.run(`INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com')`, () => {
          db.close();
        });
      } else {
        db.close();
      }
    });
  });
}

app.use(express.json());

app.get('/api/users', (req, res) => {
  const db = new sqlite3.Database('demo.db');
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      db.close();
    } else {
      res.json(rows);
      db.close();
    }
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const db = new sqlite3.Database('demo.db');
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      db.close();
    } else {
      res.json({ id: this.lastID, name, email });
      db.close();
    }
  });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const db = new sqlite3.Database('demo.db');
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      db.close();
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'User not found.' });
      db.close();
    } else {
      res.json({ success: true });
      db.close();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
