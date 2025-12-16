import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM film_types");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, iso, format, expiration_date } = req.body;
  await db.query(
    "INSERT INTO film_types (name, iso, format, expiration_date) VALUES (?, ?, ?, ?)",
    [name, iso, format, expiration_date]
  );
  res.status(201).end();
});

export default router;
