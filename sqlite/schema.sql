PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  avatar_url TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS workplaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 50,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS worker_assignments (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  workplace_id TEXT NOT NULL REFERENCES workplaces(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(worker_id, workplace_id)
);

CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  workplace_id TEXT REFERENCES workplaces(id) ON DELETE SET NULL,
  clock_in_at TEXT NOT NULL,
  clock_out_at TEXT,
  created_by TEXT REFERENCES user_profiles(user_id),
  method TEXT NOT NULL DEFAULT 'self',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_time_entries_worker_clock_in
  ON time_entries(worker_id, clock_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignments_worker
  ON worker_assignments(worker_id);

CREATE INDEX IF NOT EXISTS idx_assignments_workplace
  ON worker_assignments(workplace_id);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

