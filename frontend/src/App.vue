<template>
  <div class="app">
    <header>
      <h1>Film Roll Tracker</h1>
      <div class="actions">
        <button @click="showCameraModal = true">New Camera</button>
        <button @click="showFilmTypeModal = true">New Film Type</button>
        <button @click="openLoadRollModal">Load Roll</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="grid">
      <CameraCard
        v-for="camera in cameras"
        :key="camera.id"
        :camera="camera"
        @finish-roll="finishRoll"
      />
    </div>

    <NewCameraModal
      v-if="showCameraModal"
      :loading="saving"
      @close="showCameraModal = false"
      @save="createCamera"
    />

    <NewFilmTypeModal
      v-if="showFilmTypeModal"
      :loading="saving"
      @close="showFilmTypeModal = false"
      @save="createFilmType"
    />

    <LoadRollModal
      v-if="showLoadRollModal"
      :loading="saving"
      :cameras="cameras"
      :film-types="filmTypes"
      @close="showLoadRollModal = false"
      @save="loadRoll"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import CameraCard from "./components/CameraCard.vue";
import NewCameraModal from "./components/NewCameraModal.vue";
import NewFilmTypeModal from "./components/NewFilmTypeModal.vue";
import LoadRollModal from "./components/LoadRollModal.vue";

const cameras = ref([]);
const filmTypes = ref([]);
const showCameraModal = ref(false);
const showFilmTypeModal = ref(false);
const showLoadRollModal = ref(false);
const saving = ref(false);
const error = ref("");

const API_BASE = "http://localhost:3000";

const handleResponse = async (res) => {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch (err) {
      // ignore parsing failure
    }
    throw new Error(message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const clearError = () => {
  error.value = "";
};

const setError = (message) => {
  error.value = message;
};

const fetchCameras = async () => {
  try {
    const res = await fetch(`${API_BASE}/cameras`);
    cameras.value = await res.json();
  } catch (err) {
    setError("Failed to load cameras");
  }
};

const fetchFilmTypes = async () => {
  try {
    const res = await fetch(`${API_BASE}/film-types`);
    filmTypes.value = await res.json();
  } catch (err) {
    setError("Failed to load film types");
  }
};

onMounted(async () => {
  await Promise.all([fetchCameras(), fetchFilmTypes()]);
});

const createCamera = async (payload) => {
  saving.value = true;
  clearError();
  try {
    const res = await fetch(`${API_BASE}/cameras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await handleResponse(res);
    showCameraModal.value = false;
    await fetchCameras();
  } catch (err) {
    setError(err.message);
  } finally {
    saving.value = false;
  }
};

const createFilmType = async (payload) => {
  saving.value = true;
  clearError();
  try {
    const res = await fetch(`${API_BASE}/film-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await handleResponse(res);
    showFilmTypeModal.value = false;
    await fetchFilmTypes();
  } catch (err) {
    setError(err.message);
  } finally {
    saving.value = false;
  }
};

const openLoadRollModal = () => {
  showLoadRollModal.value = true;
};

const loadRoll = async (payload) => {
  saving.value = true;
  clearError();
  try {
    const res = await fetch(`${API_BASE}/rolls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await handleResponse(res);
    showLoadRollModal.value = false;
    await fetchCameras();
  } catch (err) {
    setError(err.message);
  } finally {
    saving.value = false;
  }
};

const finishRoll = async ({ rollId, endDate }) => {
  saving.value = true;
  clearError();
  try {
    const res = await fetch(`${API_BASE}/rolls/${rollId}/finish`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end_date: endDate }),
    });
    await handleResponse(res);
    await fetchCameras();
  } catch (err) {
    setError(err.message);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
  font-family: Arial, sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.actions button {
  margin-left: 8px;
}

.error {
  background: #ffecec;
  border: 1px solid #d8000c;
  color: #d8000c;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

button {
  cursor: pointer;
}
</style>
