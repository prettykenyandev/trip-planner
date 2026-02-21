require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Trip = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const TRIP_ID = 'family-trip-2025';

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

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
//  JOURNAL
// ══════════════════════════════════════════════════════════════
app.post('/api/trip/notes', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.notes.push(req.body);
    await trip.save();
    res.json(trip.notes.at(-1));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/trip/notes/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    const note = trip.notes.id(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    Object.assign(note, req.body);
    await trip.save();
    res.json(note);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/trip/notes/:id', async (req, res) => {
  try {
    const trip = await getTrip();
    trip.notes = trip.notes.filter(n => n._id.toString() !== req.params.id);
    await trip.save();
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Catch-all: serve frontend ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
