import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/stats", async (_req, res) => {
  const [[summary]] = await db.query(`
    SELECT
      SUM(CASE WHEN end_date IS NULL THEN 1 ELSE 0 END)                          AS active,
      SUM(CASE WHEN end_date IS NOT NULL AND scanned_at IS NULL THEN 1 ELSE 0 END) AS in_development,
      SUM(CASE WHEN scanned_at IS NOT NULL THEN 1 ELSE 0 END)                     AS finished
    FROM rolls
  `);

  const [perCamera] = await db.query(`
    SELECT c.model, COUNT(r.id) AS total
    FROM cameras c
    LEFT JOIN rolls r ON r.camera_id = c.id
    GROUP BY c.id, c.model
    ORDER BY total DESC
  `);

  const [perMonth] = await db.query(`
    SELECT DATE_FORMAT(load_date, '%Y-%m') AS month, COUNT(*) AS count
    FROM rolls
    WHERE load_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
    GROUP BY month
    ORDER BY month
  `);

  const [perFilm] = await db.query(`
    SELECT f.name, f.format, COUNT(r.id) AS count
    FROM film_types f
    LEFT JOIN rolls r ON r.film_type_id = f.id
    GROUP BY f.id, f.name, f.format
    HAVING COUNT(r.id) > 0
    ORDER BY count DESC
    LIMIT 10
  `);

  const [formatSplit] = await db.query(`
    SELECT f.format, COUNT(r.id) AS count
    FROM rolls r
    JOIN film_types f ON r.film_type_id = f.id
    GROUP BY f.format
  `);

  res.json({ summary, perCamera, perMonth, perFilm, formatSplit });
});

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

router.delete("/:id", async (req, res) => {
  const [[roll]] = await db.query(
    "SELECT id, end_date, scanned_at FROM rolls WHERE id = ?",
    [req.params.id]
  );
  if (!roll) return res.status(404).json({ error: "Roll not found" });
  if (!roll.end_date) return res.status(400).json({ error: "Use /unload for active rolls" });
  if (roll.scanned_at) return res.status(400).json({ error: "Cannot delete a roll that is already in history" });

  await db.query("DELETE FROM rolls WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

router.delete("/:id/unload", async (req, res) => {
  const [[roll]] = await db.query(
    "SELECT id, film_type_id, end_date FROM rolls WHERE id = ?",
    [req.params.id]
  );
  if (!roll) return res.status(404).json({ error: "Roll not found" });
  if (roll.end_date) return res.status(400).json({ error: "Cannot unload a finished roll" });

  await db.query(
    "UPDATE film_types SET quantity = quantity + 1 WHERE id = ?",
    [roll.film_type_id]
  );
  await db.query("DELETE FROM rolls WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

// Update NAS backup status
router.put("/:id/nas-backup", async (req, res) => {
  const { uploaded_to_nas } = req.body;
  if (uploaded_to_nas === undefined) {
    return res.status(400).json({ error: "uploaded_to_nas is required" });
  }
  await db.query(
    "UPDATE rolls SET uploaded_to_nas = ? WHERE id = ?",
    [uploaded_to_nas ? 1 : 0, req.params.id]
  );
  res.end();
});

export default router;
