import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM film_types");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, iso, format, expiration_date, quantity } = req.body;
  await db.query(
    "INSERT INTO film_types (name, iso, format, expiration_date, quantity) VALUES (?, ?, ?, ?, ?)",
    [name, iso, format, expiration_date, quantity ?? 0]
  );
  res.status(201).end();
});

router.put("/:id/quantity", async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Valid quantity is required" });
  }
  await db.query("UPDATE film_types SET quantity = ? WHERE id = ?", [quantity, req.params.id]);
  res.status(200).end();
});

router.delete("/:id", async (req, res) => {
  const [[rollCheck]] = await db.query(
    "SELECT id FROM rolls WHERE film_type_id = ? LIMIT 1",
    [req.params.id]
  );
  if (rollCheck) {
    return res.status(409).json({ error: "Cannot delete a film type that is used by rolls" });
  }
  await db.query("DELETE FROM film_types WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

export default router;
