const mongoose = require('mongoose');

// ── Destination ──────────────────────────────────────────────
const DestinationSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  emoji: { type: String, default: '📍' },
}, { _id: true });

// ── Attachment ───────────────────────────────────────────────
const AttachmentSchema = new mongoose.Schema({
  name:     { type: String, required: true },    // original filename
  path:     { type: String, required: true },    // stored file path
  mimetype: { type: String, default: '' },
  size:     { type: Number, default: 0 },
}, { _id: true });

// ── Event ────────────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  date:        { type: String, required: true },   // 'YYYY-MM-DD'
  time:        { type: String, default: '' },
  title:       { type: String, required: true },
  cat:         { type: String, enum: ['activity','transport','hotel','food','other'], default: 'activity' },
  dest:        { type: String, default: '' },       // destination _id string
  place:       { type: String, default: '' },        // specific place/venue name
  note:        { type: String, default: '' },
  duration:    { type: Number, default: 0 },        // duration in minutes (0 = not set)
  people:      { type: String, default: '' },        // comma-separated names
  cost:        { type: Number, default: 0 },          // unit cost (e.g. price per ticket)
  qty:         { type: Number, default: 1 },          // quantity (e.g. number of tickets)
  attachments: [AttachmentSchema],
}, { _id: true });

// ── Pack Item ─────────────────────────────────────────────────
const PackItemSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  cat:    { type: String, default: 'Other' },
  packed: { type: Boolean, default: false },
}, { _id: true });

// ── Expense ───────────────────────────────────────────────────
const ExpenseSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  amount: { type: Number, required: true },
  cat:    { type: String, default: 'Other' },
  date:   { type: String, default: '' },
}, { _id: true });

// ── Todo Item ─────────────────────────────────────────────────
const TodoSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  done:      { type: Boolean, default: false },
  priority:  { type: String, enum: ['low','medium','high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

// ── Trip (single shared document) ────────────────────────────
const TripSchema = new mongoose.Schema({
  tripId:       { type: String, default: 'family-trip-2025', unique: true },
  budget:       { type: Number, default: 0 },
  currency:     { type: String, default: 'USD' },
  destinations: [DestinationSchema],
  events:       [EventSchema],
  packItems:    [PackItemSchema],
  expenses:     [ExpenseSchema],
  todos:        [TodoSchema],
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
