<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CameraCard from './components/CameraCard.vue'
import LoadRollModal from './components/LoadRollModal.vue'
import NewCameraModal from './components/NewCameraModal.vue'
import NewFilmTypeModal from './components/NewFilmTypeModal.vue'

type Camera = {
  id: number
  model: string
  supported_film_type: string
}

type FilmType = {
  id: number
  name: string
  iso: number
  format: string
  expiration_date: string
}

type ActiveRoll = {
  id: number
  camera_id: number
  film_type_id: number
  load_date: string
  end_date: string | null
  model: string
  film_name: string
  iso: number
  expiration_date: string
}

const apiBase = 'http://localhost:3000'

const cameras = ref<Camera[]>([])
const filmTypes = ref<FilmType[]>([])
const activeRolls = ref<ActiveRoll[]>([])

const isLoading = ref(false)
const errorMessage = ref('')

const showCameraModal = ref(false)
const showFilmTypeModal = ref(false)
const showLoadRollModal = ref(false)

const activeRollMap = computed(() => {
  return new Map(activeRolls.value.map((roll) => [roll.camera_id, roll]))
})

const handleError = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    if (errorMessage.value === message) {
      errorMessage.value = ''
    }
  }, 4000)
}

const fetchJson = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${apiBase}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}

const refreshData = async () => {
  isLoading.value = true
  try {
    const [cameraData, filmTypeData, rollData] = await Promise.all([
      fetchJson<Camera[]>('/cameras'),
      fetchJson<FilmType[]>('/film-types'),
      fetchJson<ActiveRoll[]>('/rolls/active'),
    ])
    cameras.value = cameraData
    filmTypes.value = filmTypeData
    activeRolls.value = rollData
  } catch (err) {
    handleError((err as Error).message)
  } finally {
    isLoading.value = false
  }
}

const createCamera = async (payload: { model: string; supported_film_type: string }) => {
  try {
    const res = await fetch(`${apiBase}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error('Failed to create camera')
    }
    showCameraModal.value = false
    await refreshData()
  } catch (err) {
    handleError((err as Error).message)
  }
}

const createFilmType = async (payload: {
  name: string
  iso: number
  format: string
  expiration_date: string
}) => {
  try {
    const res = await fetch(`${apiBase}/film-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error('Failed to create film type')
    }
    showFilmTypeModal.value = false
    await refreshData()
  } catch (err) {
    handleError((err as Error).message)
  }
}

const loadRoll = async (payload: { camera_id: number; film_type_id: number; load_date: string }) => {
  try {
    const res = await fetch(`${apiBase}/rolls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const message = res.status === 400 ? 'Camera already has an active roll' : 'Failed to load roll'
      throw new Error(message)
    }
    showLoadRollModal.value = false
    await refreshData()
  } catch (err) {
    handleError((err as Error).message)
  }
}

const finishRoll = async (payload: { id: number; end_date: string }) => {
  try {
    const res = await fetch(`${apiBase}/rolls/${payload.id}/finish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ end_date: payload.end_date }),
    })
    if (!res.ok) {
      throw new Error('Failed to finish roll')
    }
    await refreshData()
  } catch (err) {
    handleError((err as Error).message)
  }
}

onMounted(() => {
  refreshData()
})
</script>

<template>
  <div class="page">
    <header class="header">
      <div>
        <p class="eyebrow">Film Roll Tracker</p>
        <h1>Camera roll status</h1>
        <p class="subtitle">Manage cameras, film types, and active rolls.</p>
      </div>
      <div class="actions">
        <button type="button" class="primary" @click="showCameraModal = true">New Camera</button>
        <button type="button" class="primary" @click="showFilmTypeModal = true">New Film Type</button>
        <button type="button" class="primary" @click="showLoadRollModal = true">Load Roll</button>
      </div>
    </header>

    <section v-if="errorMessage" class="banner error">{{ errorMessage }}</section>
    <section v-if="isLoading" class="banner muted">Loading data...</section>

    <section class="cards" v-if="cameras.length">
      <CameraCard
        v-for="camera in cameras"
        :key="camera.id"
        :camera="camera"
        :active-roll="activeRollMap.get(camera.id)"
        @finish-roll="finishRoll"
      />
    </section>
    <section v-else class="empty">No cameras created yet.</section>

    <NewCameraModal v-if="showCameraModal" @close="showCameraModal = false" @create="createCamera" />
    <NewFilmTypeModal
      v-if="showFilmTypeModal"
      @close="showFilmTypeModal = false"
      @create="createFilmType"
    />
    <LoadRollModal
      v-if="showLoadRollModal"
      :cameras="cameras"
      :film-types="filmTypes"
      :active-roll-map="activeRollMap"
      @close="showLoadRollModal = false"
      @create="loadRoll"
    />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #0b1324;
  color: #f2f6ff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #9fb4ff;
  margin: 0 0 4px;
}

.subtitle {
  color: #c7d4ff;
  margin: 6px 0 0;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  background: linear-gradient(120deg, #6c8dff, #92b5ff);
  color: #0b1324;
}

.banner {
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.banner.error {
  background: #ffb3c0;
  color: #420510;
}

.banner.muted {
  background: #1c2742;
  color: #dbe6ff;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.empty {
  text-align: center;
  color: #a8b7d9;
  padding: 40px 0;
}
</style>
