import express from "express";
import { db } from "../db.js";

const router = express.Router();

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

export default router;
