-- Migration 002: Roll inventory
-- Run this on the NAS MySQL instance.

ALTER TABLE film_types
  ADD COLUMN quantity INT NOT NULL DEFAULT 0;
