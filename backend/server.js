import express from "express";
import cors from "cors";

import camerasRouter from "./routes/cameras.js";
import filmTypesRouter from "./routes/filmTypes.js";
import rollsRouter from "./routes/rolls.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/cameras", camerasRouter);
app.use("/film-types", filmTypesRouter);
app.use("/rolls", rollsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
