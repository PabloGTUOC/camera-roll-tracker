-- Migration 004: NAS backup tracking
-- Run this on the NAS MySQL instance.

ALTER TABLE rolls
  ADD COLUMN uploaded_to_nas TINYINT(1) NOT NULL DEFAULT 0;
