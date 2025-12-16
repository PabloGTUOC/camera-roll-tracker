import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const [cameras] = await db.query("SELECT * FROM cameras ORDER BY id");
    if (!cameras.length) {
      return res.json([]);
    }

    const ids = cameras.map((c) => c.id);

    const [activeRolls] = await db.query(
      `SELECT r.*, f.name AS film_name, f.iso, f.format, f.expiration_date
       FROM rolls r
       JOIN film_types f ON r.film_type_id = f.id
       WHERE r.end_date IS NULL AND r.camera_id IN (?)
       ORDER BY r.id`,
      [ids]
    );

    const [finishedRolls] = await db.query(
      `SELECT r.*, f.name AS film_name, f.iso, f.format, f.expiration_date
       FROM rolls r
       JOIN film_types f ON r.film_type_id = f.id
       WHERE r.end_date IS NOT NULL AND r.camera_id IN (?)
       ORDER BY r.load_date DESC, r.id DESC`,
      [ids]
    );

    const activeByCamera = activeRolls.reduce((acc, roll) => {
      acc[roll.camera_id] = roll;
      return acc;
    }, {});

    const finishedByCamera = finishedRolls.reduce((acc, roll) => {
      if (!acc[roll.camera_id]) acc[roll.camera_id] = [];
      acc[roll.camera_id].push(roll);
      return acc;
    }, {});

    const payload = cameras.map((camera) => ({
      ...camera,
      active_roll: activeByCamera[camera.id] ?? null,
      finished_rolls: finishedByCamera[camera.id] ?? [],
    }));

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { model, supported_film_type } = req.body;
  if (!model || !supported_film_type) {
    return res.status(400).json({ error: "Model and supported film type are required" });
  }

  try {
    await db.query(
      "INSERT INTO cameras (model, supported_film_type) VALUES (?, ?)",
      [model, supported_film_type]
    );
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

export default router;
