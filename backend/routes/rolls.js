import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/active", async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, c.model, f.name AS film_name, f.iso, f.expiration_date, f.format
      FROM rolls r
      JOIN cameras c ON r.camera_id = c.id
      JOIN film_types f ON r.film_type_id = f.id
      WHERE r.end_date IS NULL
      ORDER BY r.id
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { camera_id, film_type_id, load_date } = req.body;
  if (!camera_id || !film_type_id || !load_date) {
    return res.status(400).json({ error: "Camera, film type, and load date are required" });
  }

  const parsedLoadDate = new Date(load_date);
  if (Number.isNaN(parsedLoadDate.getTime())) {
    return res.status(400).json({ error: "Load date is invalid" });
  }

  try {
    const [[camera]] = await db.query("SELECT * FROM cameras WHERE id = ?", [camera_id]);
    if (!camera) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const [[film]] = await db.query("SELECT * FROM film_types WHERE id = ?", [film_type_id]);
    if (!film) {
      return res.status(404).json({ error: "Film type not found" });
    }

    if (film.format !== camera.supported_film_type) {
      return res.status(400).json({ error: "Film format must match camera supported film type" });
    }

    const [[active]] = await db.query(
      "SELECT id FROM rolls WHERE camera_id = ? AND end_date IS NULL",
      [camera_id]
    );
    if (active) {
      return res.status(400).json({ error: "Camera already has an active roll" });
    }

    const [result] = await db.query(
      "INSERT INTO rolls (camera_id, film_type_id, load_date) VALUES (?, ?, ?)",
      [camera_id, film_type_id, load_date]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

router.put("/:id/finish", async (req, res, next) => {
  const { end_date } = req.body;
  if (!end_date) {
    return res.status(400).json({ error: "End date is required" });
  }

  const parsedEndDate = new Date(end_date);
  if (Number.isNaN(parsedEndDate.getTime())) {
    return res.status(400).json({ error: "End date is invalid" });
  }

  try {
    const [[roll]] = await db.query("SELECT * FROM rolls WHERE id = ?", [req.params.id]);
    if (!roll) {
      return res.status(404).json({ error: "Roll not found" });
    }
    if (roll.end_date) {
      return res.status(400).json({ error: "Roll is already finished" });
    }

    if (new Date(roll.load_date) > parsedEndDate) {
      return res.status(400).json({ error: "End date cannot be before load date" });
    }

    await db.query("UPDATE rolls SET end_date = ? WHERE id = ?", [end_date, req.params.id]);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
