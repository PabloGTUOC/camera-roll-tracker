-- Migration 001: Lab tracking
-- Run this on the NAS MySQL instance.
-- Safe to run on existing data — all columns default to NULL.

ALTER TABLE rolls
  ADD COLUMN lab_name          VARCHAR(255) DEFAULT NULL,
  ADD COLUMN sent_to_lab_date  DATE         DEFAULT NULL,
  ADD COLUMN scanned_at        DATE         DEFAULT NULL;
