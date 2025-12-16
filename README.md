# Film Roll Tracker

A simple web application to track analog cameras, film types, and film rolls loaded in cameras.

The app allows the user to:
- Register cameras
- Register film types (including expiration dates)
- Load film rolls into cameras
- Track active and finished rolls
- Persist all data in a MySQL database

The frontend is built with Vue 3.
The backend exposes a REST API and connects to MySQL.

---

## Core Concepts

The application models three real-world entities:

1. Camera  
2. Film Type  
3. Roll (a film loaded into a camera for a period of time)

A camera can have **at most one active roll** at any time.

A roll is considered **active** when `end_date` is NULL and **finished** when `end_date` is set.

Film types include an expiration date, which should be shown in the UI and flagged when expired.

---

## Data Model

### cameras
- id (INT, PK, AUTO_INCREMENT)
- model (VARCHAR)
- supported_film_type (VARCHAR)  
  Examples: `35mm`, `120`
- created_at (TIMESTAMP)

### film_types
- id (INT, PK, AUTO_INCREMENT)
- name (VARCHAR)
- iso (INT)
- format (VARCHAR)  
  Examples: `35mm`, `120`
- expiration_date (DATE)
- created_at (TIMESTAMP)

### rolls
- id (INT, PK, AUTO_INCREMENT)
- camera_id (INT, FK → cameras.id)
- film_type_id (INT, FK → film_types.id)
- load_date (DATE)
- end_date (DATE, NULLABLE)
- created_at (TIMESTAMP)

---

## Business Rules

- A camera may only have one active roll (`end_date IS NULL`)
- Film format must match camera supported film type
- Expired film is allowed but should be visually flagged
- When a roll is finished, the `end_date` is set and the roll becomes historical

---

## Frontend (Vue 3)

### Main UI Requirements

- Display cameras in a card layout
- Each camera card shows:
  - Camera model
  - Supported film type
  - Current loaded film (if any)
  - Load date
  - Expiration date of the film
  - End date input if the roll is active

### Global Actions (top of the UI)

- Create new camera
- Create new film type
- Load new roll into a camera

All creation actions should be done via modal dialogs.

---

## Components

Suggested Vue components:

- `App.vue`
- `CameraCard.vue`
- `NewCameraModal.vue`
- `NewFilmTypeModal.vue`
- `LoadRollModal.vue`

Vue Composition API should be used.

State should be managed locally in `App.vue` for simplicity.

---

## Backend API

The backend exposes a REST API returning JSON.

### Endpoints

#### Cameras
- `GET /cameras`
- `POST /cameras`

#### Film Types
- `GET /film-types`
- `POST /film-types`

#### Rolls
- `GET /rolls/active`
- `POST /rolls`
- `PUT /rolls/:id/finish`

---

## Backend Responsibilities

- Validate film format compatibility
- Enforce one active roll per camera
- Persist data in MySQL
- Return meaningful error messages for invalid operations

---

## Tech Stack

- Frontend: Vue 3 + Vite
- Backend: Node.js + Express (or equivalent REST backend)
- Database: MySQL
- Communication: JSON over HTTP

---

## Non-Goals (for now)

- Authentication
- User accounts
- Cloud deployment
- Mobile app

---

## Future Ideas (out of scope)

- Shot count per roll
- Push/pull notes
- Lab sent / scan received tracking
- Statistics per camera and film type

---

## Project Goal

Keep the application simple, maintainable, and focused on analog film tracking.
Avoid overengineering.

film-roll-tracker/
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── routes/
│       ├── cameras.js
│       ├── filmTypes.js
│       └── rolls.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       └── components/
│           ├── CameraCard.vue
│           ├── NewCameraModal.vue
│           ├── NewFilmTypeModal.vue
│           └── LoadRollModal.vue
└── database/
    └── schema.sql
CREATE DATABASE IF NOT EXISTS film_tracker;
USE film_tracker;

CREATE TABLE cameras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model VARCHAR(255) NOT NULL,
  supported_film_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE film_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  iso INT NOT NULL,
  format VARCHAR(50) NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rolls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  camera_id INT NOT NULL,
  film_type_id INT NOT NULL,
  load_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_camera FOREIGN KEY (camera_id) REFERENCES cameras(id),
  CONSTRAINT fk_film FOREIGN KEY (film_type_id) REFERENCES film_types(id)
);

{
  "name": "film-roll-tracker-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mysql2": "^3.9.0",
    "cors": "^2.8.5"
  }
}

import mysql from "mysql2/promise";

export const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "film_tracker"
});

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

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_, res) => {
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
import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", async (_, res) => {
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
import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/active", async (_, res) => {
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

  const [[active]] = await db.query(
    "SELECT id FROM rolls WHERE camera_id = ? AND end_date IS NULL",
    [camera_id]
  );
  if (active) {
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
{
  "name": "film-roll-tracker-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
<template>
  <div>
    <h1>Film Roll Tracker</h1>
    <CameraCard
      v-for="camera in cameras"
      :key="camera.id"
      :camera="camera"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import CameraCard from "./components/CameraCard.vue";

const cameras = ref([]);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/cameras");
  cameras.value = await res.json();
});
</script>
<template>
  <div class="card">
    <h3>{{ camera.model }}</h3>
    <p>Supported film: {{ camera.supported_film_type }}</p>
  </div>
</template>

<script setup>
defineProps({
  camera: Object
});
</script>

