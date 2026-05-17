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

const apiBase = '/api'
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
        <button type="button" class="btn" :class="{ active: currentTab === 'development' }" @click="currentTab = 'development'">
          Development
          <span v-if="developmentRolls.length" class="count">{{ developmentRolls.length }}</span>
        </button>
        <button type="button" class="btn" :class="{ active: currentTab === 'history' }" @click="currentTab = 'history'">
          History
          <span v-if="historyRolls.length" class="count">{{ historyRolls.length }}</span>
        </button>
        <button type="button" class="btn" :class="{ active: currentTab === 'cameras' }" @click="currentTab = 'cameras'">
          Cameras
        </button>
        <button type="button" class="btn" @click="showCameraModal = true">New Camera</button>
        <button type="button" class="btn" @click="showFilmTypeModal = true">New Film Type</button>
        <button type="button" class="btn" @click="showLoadRollModal = true">Load Roll</button>
      </div>
    </header>

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

      <!-- Film type inventory -->
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
                <button class="btn btn-sm btn-ghost" type="button" @click="filmTypeDeleteConfirm = ft.id">Delete</button>
              </template>
              <template v-else>
                <span class="confirm-text">Are you sure?</span>
                <button class="btn btn-sm btn-danger" type="button" @click="deleteFilmType(ft.id)">Yes, delete</button>
                <button class="btn btn-sm btn-ghost" type="button" @click="filmTypeDeleteConfirm = null">Cancel</button>
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
:global(*) { box-sizing: border-box; }

:global(body) {
  margin: 0;
  background: #f0efeb;
  color: #111;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 12px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px;
}

h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  color: #111;
}

.subtitle {
  color: #555;
  margin: 6px 0 0;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  padding-top: 4px;
}

/* Base button */
.btn {
  background: #111;
  color: #fff;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 #111;
  transition: transform 0.1s, box-shadow 0.1s;
  white-space: nowrap;
}

.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #111;
}

.btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #111;
}

.btn.active {
  background: #fff;
  color: #111;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
}

.btn-ghost {
  background: #fff;
  color: #111;
  box-shadow: 2px 2px 0 #111;
}

.btn-danger {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
  box-shadow: 2px 2px 0 #7a1a11;
}

.count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #111;
  font-size: 10px;
  font-weight: 900;
  border-radius: 10px;
  padding: 1px 6px;
  margin-left: 6px;
}

.btn.active .count {
  background: #111;
  color: #fff;
}

/* Banners */
.banner {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 2px solid #111;
  font-weight: 600;
}

.banner.error { background: #ffe0e0; color: #7a1a1a; }
.banner.muted { background: #fff; color: #555; }

/* Cards grid */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.empty {
  text-align: center;
  color: #777;
  padding: 48px 0;
  font-size: 15px;
}

/* Film type inventory */
.inventory { margin-top: 40px; }

.inventory-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #111;
  margin: 0 0 12px;
}

.film-list { display: flex; flex-direction: column; gap: 8px; }

.film-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 2px solid #111;
  border-radius: 10px;
  padding: 12px 16px;
  gap: 12px;
  box-shadow: 3px 3px 0 #111;
}

.film-row__info { display: flex; flex-direction: column; gap: 2px; }
.film-row__name { font-weight: 700; font-size: 14px; }
.film-row__meta { font-size: 12px; color: #666; }
.film-row__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.confirm-text { font-size: 12px; font-weight: 700; color: #c0392b; }
.empty-small { color: #888; font-size: 13px; margin: 0; }
</style>
