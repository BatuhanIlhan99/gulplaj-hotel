CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, day TEXT NOT NULL, visitor_key TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('page_view','booking_open')), path TEXT NOT NULL, referrer TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS events_day ON events(day);
CREATE TABLE IF NOT EXISTS reservations (
 id TEXT PRIMARY KEY, reference TEXT NOT NULL, booked_day TEXT NOT NULL,
 updated_at TEXT NOT NULL, checkin TEXT NOT NULL, checkout TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('reserved','confirmed','canceled')),
 channel TEXT NOT NULL, channel_label TEXT NOT NULL, currency TEXT NOT NULL,
 total_minor INTEGER NOT NULL CHECK(total_minor >= 0), paid_minor INTEGER,
 rooms INTEGER NOT NULL, guests INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reservations_booked ON reservations(booked_day);
CREATE TABLE IF NOT EXISTS report_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
