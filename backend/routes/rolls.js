import express from "express";
import { db } from "../db.js";

const router = express.Router();

// --- Existing endpoints (unchanged) ---

router.get("/active", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT r.*, c.model, f.name AS film_name, f.iso, f.expiration_date
    FROM rolls r
    JOIN cameras c ON r.camera_id = c.id
    JOIN film_types f ON r.film_type_id = f.id
    WHERE r.end_date IS NULL
  `);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { camera_id, film_type_id, load_date } = req.body;

  const [[activeRoll]] = await db.query(
    "SELECT id FROM rolls WHERE camera_id = ? AND end_date IS NULL",
    [camera_id]
  );
  if (activeRoll) {
    return res.status(400).json({ error: "Camera already has an active roll" });
  }

  await db.query(
    "INSERT INTO rolls (camera_id, film_type_id, load_date) VALUES (?, ?, ?)",
    [camera_id, film_type_id, load_date]
  );

  await db.query(
    "UPDATE film_types SET quantity = GREATEST(0, quantity - 1) WHERE id = ?",
    [film_type_id]
  );

  res.status(201).end();
});

router.put("/:id/finish", async (req, res) => {
  const { end_date } = req.body;
  await db.query(
    "UPDATE rolls SET end_date = ? WHERE id = ?",
    [end_date, req.params.id]
  );
  res.end();
});

// --- New endpoints ---

// Development tab: finished rolls not yet scanned
router.get("/development", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT r.*, c.model, f.name AS film_name, f.iso, f.format, f.expiration_date
    FROM rolls r
    JOIN cameras c ON r.camera_id = c.id
    JOIN film_types f ON r.film_type_id = f.id
    WHERE r.end_date IS NOT NULL AND r.scanned_at IS NULL
    ORDER BY r.end_date DESC
  `);
  res.json(rows);
});

// History tab: fully completed rolls
router.get("/history", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT r.*, c.model, f.name AS film_name, f.iso, f.format, f.expiration_date
    FROM rolls r
    JOIN cameras c ON r.camera_id = c.id
    JOIN film_types f ON r.film_type_id = f.id
    WHERE r.scanned_at IS NOT NULL
    ORDER BY r.scanned_at DESC
  `);
  res.json(rows);
});

// Record lab delivery
router.put("/:id/send-to-lab", async (req, res) => {
  const { lab_name, sent_to_lab_date } = req.body;
  if (!lab_name || !sent_to_lab_date) {
    return res.status(400).json({ error: "lab_name and sent_to_lab_date are required" });
  }
  await db.query(
    "UPDATE rolls SET lab_name = ?, sent_to_lab_date = ? WHERE id = ?",
    [lab_name, sent_to_lab_date, req.params.id]
  );
  res.end();
});

// Mark roll as scanned / returned
router.put("/:id/mark-scanned", async (req, res) => {
  const { scanned_at } = req.body;
  if (!scanned_at) {
    return res.status(400).json({ error: "scanned_at is required" });
  }
  await db.query(
    "UPDATE rolls SET scanned_at = ? WHERE id = ?",
    [scanned_at, req.params.id]
  );
  res.end();
});

export default router;
