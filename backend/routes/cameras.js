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

export default router;
