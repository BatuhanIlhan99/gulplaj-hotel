CREATE TABLE IF NOT EXISTS contact_events (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  visitor_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('phone_click','whatsapp_click')),
  path TEXT NOT NULL,
  referrer TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS contact_events_day ON contact_events(day);
