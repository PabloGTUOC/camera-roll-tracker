import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM film_types ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { name, iso, format, expiration_date } = req.body;
  if (!name || !iso || !format || !expiration_date) {
    return res.status(400).json({ error: "Name, ISO, format, and expiration date are required" });
  }

  try {
    await db.query(
      "INSERT INTO film_types (name, iso, format, expiration_date) VALUES (?, ?, ?, ?)",
      [name, iso, format, expiration_date]
    );
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

export default router;
