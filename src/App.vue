<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CameraCard from './components/CameraCard.vue'
import DevelopmentRollCard from './components/DevelopmentRollCard.vue'
import HistoryTable from './components/HistoryTable.vue'
import LoadRollModal from './components/LoadRollModal.vue'
import NewCameraModal from './components/NewCameraModal.vue'
import NewFilmTypeModal from './components/NewFilmTypeModal.vue'

type Camera = { id: number; model: string; supported_film_type: string }
type FilmType = { id: number; name: string; iso: number; format: string; expiration_date: string }
type ActiveRoll = {
  id: number; camera_id: number; film_type_id: number
  load_date: string; end_date: string | null
  model: string; film_name: string; iso: number; expiration_date: string
}
type DevelopmentRoll = {
  id: number; camera_id: number; model: string; film_name: string
  iso: number; format: string; load_date: string; end_date: string
  lab_name: string | null; sent_to_lab_date: string | null; scanned_at: string | null
}
type HistoryRoll = DevelopmentRoll & { scanned_at: string }

type Tab = 'cameras' | 'development' | 'history'

const apiBase = 'http://localhost:3000'
const currentTab = ref<Tab>('cameras')

const cameras = ref<Camera[]>([])
const filmTypes = ref<FilmType[]>([])
const activeRolls = ref<ActiveRoll[]>([])
const developmentRolls = ref<DevelopmentRoll[]>([])
const historyRolls = ref<HistoryRoll[]>([])

const isLoading = ref(false)
const errorMessage = ref('')

const showCameraModal = ref(false)
const showFilmTypeModal = ref(false)
const showLoadRollModal = ref(false)
const filmTypeDeleteConfirm = ref<number | null>(null)

const activeRollMap = computed(() => new Map(activeRolls.value.map((r) => [r.camera_id, r])))

const handleError = (message: string) => {
  errorMessage.value = message
  setTimeout(() => { if (errorMessage.value === message) errorMessage.value = '' }, 4000)
}

const fetchJson = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${apiBase}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const refreshData = async () => {
  isLoading.value = true
  try {
    const [cameraData, filmTypeData, rollData, devData, histData] = await Promise.all([
      fetchJson<Camera[]>('/cameras'),
      fetchJson<FilmType[]>('/film-types'),
      fetchJson<ActiveRoll[]>('/rolls/active'),
      fetchJson<DevelopmentRoll[]>('/rolls/development'),
      fetchJson<HistoryRoll[]>('/rolls/history'),
    ])
    cameras.value = cameraData
    filmTypes.value = filmTypeData
    activeRolls.value = rollData
    developmentRolls.value = devData
    historyRolls.value = histData
  } catch (err) { handleError((err as Error).message) }
  finally { isLoading.value = false }
}

const post = async (path: string, body: object) => {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }
}

const put = async (path: string, body: object) => {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
}

const del = async (path: string) => {
  const res = await fetch(`${apiBase}${path}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }
}

const createCamera = async (payload: { model: string; supported_film_type: string }) => {
  try { await post('/cameras', payload); showCameraModal.value = false; await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const createFilmType = async (payload: { name: string; iso: number; format: string; expiration_date: string }) => {
  try { await post('/film-types', payload); showFilmTypeModal.value = false; await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const loadRoll = async (payload: { camera_id: number; film_type_id: number; load_date: string }) => {
  try { await post('/rolls', payload); showLoadRollModal.value = false; await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const finishRoll = async (payload: { id: number; end_date: string }) => {
  try { await put(`/rolls/${payload.id}/finish`, { end_date: payload.end_date }); await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const sendToLab = async (payload: { id: number; lab_name: string; sent_to_lab_date: string }) => {
  try { await put(`/rolls/${payload.id}/send-to-lab`, { lab_name: payload.lab_name, sent_to_lab_date: payload.sent_to_lab_date }); await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const markScanned = async (payload: { id: number; scanned_at: string }) => {
  try { await put(`/rolls/${payload.id}/mark-scanned`, { scanned_at: payload.scanned_at }); await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const deleteCamera = async (id: number) => {
  try { await del(`/cameras/${id}`); await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const deleteFilmType = async (id: number) => {
  try { await del(`/film-types/${id}`); filmTypeDeleteConfirm.value = null; await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

onMounted(refreshData)
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

    <!-- Tab bar -->
    <nav class="tabs">
      <button
        v-for="tab in (['cameras', 'development', 'history'] as Tab[])"
        :key="tab"
        class="tab"
        :class="{ active: currentTab === tab }"
        type="button"
        @click="currentTab = tab"
      >
        <span v-if="tab === 'cameras'">📷 Cameras
          <span v-if="activeRolls.length" class="badge">{{ activeRolls.length }}</span>
        </span>
        <span v-else-if="tab === 'development'">🧪 Development
          <span v-if="developmentRolls.length" class="badge">{{ developmentRolls.length }}</span>
        </span>
        <span v-else>🗂 History
          <span v-if="historyRolls.length" class="badge muted">{{ historyRolls.length }}</span>
        </span>
      </button>
    </nav>

    <section v-if="errorMessage" class="banner error">{{ errorMessage }}</section>
    <section v-if="isLoading" class="banner muted">Loading data...</section>

    <!-- Cameras tab -->
    <template v-if="currentTab === 'cameras'">
      <section class="cards" v-if="cameras.length">
        <CameraCard
          v-for="camera in cameras"
          :key="camera.id"
          :camera="camera"
          :active-roll="activeRollMap.get(camera.id)"
          @finish-roll="finishRoll"
          @delete-camera="deleteCamera"
        />
      </section>
      <section v-else class="empty">No cameras created yet.</section>

      <!-- Film types inventory -->
      <section class="inventory">
        <h2 class="inventory-title">Film Type Inventory</h2>
        <div v-if="filmTypes.length" class="film-list">
          <div v-for="ft in filmTypes" :key="ft.id" class="film-row">
            <div class="film-row__info">
              <span class="film-row__name">{{ ft.name }}</span>
              <span class="film-row__meta">ISO {{ ft.iso }} · {{ ft.format }} · exp. {{ ft.expiration_date }}</span>
            </div>
            <div class="film-row__actions">
              <template v-if="filmTypeDeleteConfirm !== ft.id">
                <button class="delete-btn" type="button" @click="filmTypeDeleteConfirm = ft.id">🗑</button>
              </template>
              <template v-else>
                <span class="confirm-text">Delete?</span>
                <button class="confirm-yes" type="button" @click="deleteFilmType(ft.id)">Yes</button>
                <button class="confirm-no" type="button" @click="filmTypeDeleteConfirm = null">No</button>
              </template>
            </div>
          </div>
        </div>
        <p v-else class="empty-small">No film types yet.</p>
      </section>
    </template>

    <!-- Development tab -->
    <template v-else-if="currentTab === 'development'">
      <section class="cards" v-if="developmentRolls.length">
        <DevelopmentRollCard
          v-for="roll in developmentRolls"
          :key="roll.id"
          :roll="roll"
          @send-to-lab="sendToLab"
          @mark-scanned="markScanned"
        />
      </section>
      <section v-else class="empty">No rolls in development. Finish a roll to see it here.</section>
    </template>

    <!-- History tab -->
    <template v-else>
      <HistoryTable :rolls="historyRolls" />
    </template>

    <NewCameraModal v-if="showCameraModal" @close="showCameraModal = false" @create="createCamera" />
    <NewFilmTypeModal v-if="showFilmTypeModal" @close="showFilmTypeModal = false" @create="createFilmType" />
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

h1 { margin: 0; }

.subtitle { color: #c7d4ff; margin: 6px 0 0; }

.actions { display: flex; gap: 10px; }

button { border: none; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 600; }

.primary { background: linear-gradient(120deg, #6c8dff, #92b5ff); color: #0b1324; }

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #1a2a46;
  padding-bottom: 0;
}

.tab {
  background: transparent;
  color: #6b7fa8;
  border-radius: 8px 8px 0 0;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  border-bottom: none;
  transition: color 0.15s, background 0.15s;
  position: relative;
  bottom: -1px;
}

.tab.active {
  color: #f2f6ff;
  background: #111c33;
  border-color: #1a2a46;
  border-bottom-color: #111c33;
}

.tab:hover:not(.active) { color: #c7d4ff; }

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #6c8dff;
  color: #0b1324;
  font-size: 10px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 6px;
  margin-left: 6px;
  vertical-align: middle;
}

.badge.muted { background: #2a3a5e; color: #8ca0cc; }

/* Banners */
.banner { padding: 12px 14px; border-radius: 10px; margin-bottom: 16px; }
.banner.error { background: #ffb3c0; color: #420510; }
.banner.muted { background: #1c2742; color: #dbe6ff; }

/* Cards grid */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }

.empty { text-align: center; color: #a8b7d9; padding: 40px 0; }

/* Film type inventory */
.inventory { margin-top: 32px; }

.inventory-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #6c8dff;
  margin: 0 0 12px;
}

.film-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.film-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111c33;
  border: 1px solid #1e2c4c;
  border-radius: 10px;
  padding: 10px 14px;
  gap: 12px;
}

.film-row__info { display: flex; flex-direction: column; gap: 2px; }
.film-row__name { font-weight: 600; font-size: 14px; }
.film-row__meta { font-size: 12px; color: #7a90bc; }

.film-row__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.delete-btn {
  background: transparent;
  color: #4e6088;
  border: 1px solid #243150;
  border-radius: 7px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.delete-btn:hover { color: #ff7c8a; border-color: #ff7c8a; }

.confirm-text { font-size: 12px; color: #ff9faa; font-weight: 600; }

.confirm-yes {
  background: #c0392b; color: #fff;
  border-radius: 6px; padding: 4px 8px; font-size: 12px;
}

.confirm-no {
  background: #243150; color: #b5c4e8;
  border-radius: 6px; padding: 4px 8px; font-size: 12px;
}

.empty-small { color: #5a6e94; font-size: 13px; margin: 0; }
</style>
