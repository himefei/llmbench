CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#2563eb',
  logo_url TEXT,
  homepage_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  model_id TEXT NOT NULL,
  benchmark_key TEXT NOT NULL,
  score REAL NOT NULL CHECK(score >= 0 AND score <= 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (model_id, benchmark_key),
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_benchmark ON scores (benchmark_key);
CREATE INDEX IF NOT EXISTS idx_models_updated_at ON models (updated_at DESC);