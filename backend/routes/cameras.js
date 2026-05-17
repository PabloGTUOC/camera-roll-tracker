import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM cameras");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { model, supported_film_type } = req.body;
  await db.query(
    "INSERT INTO cameras (model, supported_film_type) VALUES (?, ?)",
    [model, supported_film_type]
  );
  res.status(201).end();
});

router.delete("/:id", async (req, res) => {
  const [[rollCheck]] = await db.query(
    "SELECT id FROM rolls WHERE camera_id = ? LIMIT 1",
    [req.params.id]
  );
  if (rollCheck) {
    return res.status(409).json({ error: "Cannot delete a camera that has rolls" });
  }
  await db.query("DELETE FROM cameras WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

export default router;
