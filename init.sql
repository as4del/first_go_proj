CREATE TABLE IF NOT EXISTS users (
                                     username TEXT PRIMARY KEY,
                                     email TEXT UNIQUE NOT NULL,
                                     password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS links (
                                     id BIGSERIAL PRIMARY KEY,
                                     username TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );