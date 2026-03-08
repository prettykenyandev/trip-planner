require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Trip = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const TRIP_ID = 'family-trip-2025';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ── DB connect ───────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── Helper: get or create the shared trip doc ────────────────
async function getTrip() {
  let trip = await Trip.findOne({ tripId: TRIP_ID });
  if (!trip) {
    trip = await Trip.create({
      tripId: TRIP_ID,
      destinations: [
        { name: 'New York',    emoji: '🗽' },
        { name: 'Boston',      emoji: '🦞' },
        { name: 'Florida',     emoji: '🌴' },
        { name: 'California',  emoji: '🌉' },
        { name: 'Washington',  emoji: '🏛️' },
        { name: 'Toronto',     emoji: '🍁' },
      ],
      packItems: [
        { name: 'Passport',               cat: 'Documents' },
        { name: 'Travel insurance docs',  cat: 'Documents' },
        { name: 'Flight tickets',         cat: 'Documents' },
        { name: 'Phone charger',          cat: 'Electronics' },
        { name: 'Adapter/converter',      cat: 'Electronics' },
        { name: 'Toothbrush & toothpaste',cat: 'Toiletries' },
        { name: 'Sunscreen',              cat: 'Toiletries' },
        { name: 'T-shirts (x5)',          cat: 'Clothes' },
        { name: 'Comfortable walking shoes', cat: 'Clothes' },
        { name: 'Lightweight jacket',     cat: 'Clothes' },
      ]
    });
  }
  return trip;
}

// ── GET entire trip state ─────────────────────────────────────
app.get('/api/trip', async (req, res) => {
  try {
    const trip = await getTrip();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  DESTINATIONS
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/destinations', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.destinations.push(req.body);
    await trip.save();
    res.json(trip.destinations.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/destinations/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.destinations = trip.destinations.filter(d => d._id.toString() !== req.params.id);
    // clean up events referencing this destination
    trip.events = trip.events.map(e => { if(e.dest===req.params.id) e.dest=''; return e; });
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/events', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.events.push(req.body);
    await trip.save();
    res.json(trip.events.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/events/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.events = trip.events.filter(e => e._id.toString() !== req.params.id);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/trip/events/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    const ev = trip.events.id(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Not found' });
    Object.assign(ev, req.body);
    await trip.save();
    res.json(ev);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  PACKING
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/pack', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.packItems.push(req.body);
    await trip.save();
    res.json(trip.packItems.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/trip/pack/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    const item = trip.packItems.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (req.body.packed !== undefined) item.packed = req.body.packed;
    await trip.save();
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/pack/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.packItems = trip.packItems.filter(p => p._id.toString() !== req.params.id);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  BUDGET & EXPENSES
// ══════════════════════════════════════════════════════════════
app.patch('/api/trip/budget', async (req, res) => {
  try {
    const trip = await getTrip();
    if (req.body.budget !== undefined) trip.budget = req.body.budget;
    if (req.body.currency) trip.currency = req.body.currency;
    await trip.save();
    res.json({ budget: trip.budget, currency: trip.currency });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/trip/expenses', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.expenses.push(req.body);
    await trip.save();
    res.json(trip.expenses.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/expenses/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.expenses = trip.expenses.filter(e => e._id.toString() !== req.params.id);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  EVENT ATTACHMENTS
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/events/:id/attachments', upload.array('files', 10), async (req, res) => {
  try {
    const trip = await getTrip();
    const ev = trip.events.id(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    const newAttachments = req.files.map(f => ({
      name: f.originalname,
      path: '/uploads/' + f.filename,
      mimetype: f.mimetype,
      size: f.size,
    }));
    ev.attachments.push(...newAttachments);
    await trip.save();
    res.json(ev.attachments);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/events/:eventId/attachments/:attachId', async (req, res) => {
  try {
    const trip = await getTrip();
    const ev = trip.events.id(req.params.eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    const att = ev.attachments.id(req.params.attachId);
    if (!att) return res.status(404).json({ error: 'Attachment not found' });
    // Delete file from disk
    const filePath = path.join(__dirname, att.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    ev.attachments = ev.attachments.filter(a => a._id.toString() !== req.params.attachId);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  TODOS
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/todos', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.todos.push(req.body);
    await trip.save();
    res.json(trip.todos.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/trip/todos/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    const todo = trip.todos.id(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Not found' });
    Object.assign(todo, req.body);
    await trip.save();
    res.json(todo);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/todos/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.todos = trip.todos.filter(t => t._id.toString() !== req.params.id);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
//  CALENDAR EXPORT (ICS)
// ══════════════════════════════════════════════════════════════
app.get('/api/trip/events/:id/ics', async (req, res) => {
  try {
    const trip = await getTrip();
    const ev = trip.events.id(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    // Build DTSTART
    let dtStart, dtEnd;
    if (ev.time) {
      const [h, m] = ev.time.split(':').map(Number);
      dtStart = `${ev.date.replace(/-/g, '')}T${pad(h)}${pad(m)}00`;
      const durMin = ev.duration || 60; // default 1 hour if no duration
      const startMin = h * 60 + m + durMin;
      const endH = Math.floor(startMin / 60) % 24;
      const endM = startMin % 60;
      dtEnd = `${ev.date.replace(/-/g, '')}T${pad(endH)}${pad(endM)}00`;
    } else {
      dtStart = `${ev.date.replace(/-/g, '')}`;  // all-day
      const nextDay = new Date(ev.date + 'T12:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      dtEnd = `${nextDay.getFullYear()}${pad(nextDay.getMonth()+1)}${pad(nextDay.getDate())}`;
    }

    const dest = ev.dest ? (trip.destinations.find(d => d._id.toString() === ev.dest) || {}) : {};
    const location = [ev.place, dest.name ? `${dest.emoji || ''} ${dest.name}`.trim() : ''].filter(Boolean).join(', ');

    let description = '';
    if (ev.note) description += ev.note;
    if (ev.people) description += (description ? '\\n' : '') + 'With: ' + ev.people;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FamilyTripPlanner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ev._id}@trip-planner`,
      `DTSTAMP:${stamp}`,
      ev.time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
      ev.time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ev.title}`,
      location ? `LOCATION:${location}` : '',
      description ? `DESCRIPTION:${description}` : '',
      `CATEGORIES:${ev.cat.toUpperCase()}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ev.title.replace(/[^a-zA-Z0-9]/g,'_')}.ics"`,
    });
    res.send(ics);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Catch-all: serve frontend ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
