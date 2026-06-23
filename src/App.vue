<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CameraCard from './components/CameraCard.vue'
import DevelopmentRollCard from './components/DevelopmentRollCard.vue'
import HistoryTable from './components/HistoryTable.vue'
import LoadRollModal from './components/LoadRollModal.vue'
import NewCameraModal from './components/NewCameraModal.vue'
import NewFilmTypeModal from './components/NewFilmTypeModal.vue'

type Camera = { id: number; model: string; supported_film_type: string }
type FilmType = { id: number; name: string; iso: number; format: string; expiration_date: string; quantity: number }
type ActiveRoll = {
  id: number; camera_id: number; film_type_id: number
  load_date: string; end_date: string | null
  model: string; film_name: string; iso: number; expiration_date: string
}
type DevelopmentRoll = {
  id: number; camera_id: number; film_type_id: number; model: string; film_name: string
  iso: number; format: string; load_date: string; end_date: string
  lab_name: string | null; sent_to_lab_date: string | null; scanned_at: string | null
  uploaded_to_nas: number
}
type HistoryRoll = DevelopmentRoll & { scanned_at: string }
type Tab = 'cameras' | 'inventory' | 'development' | 'history'

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

const filterFormat = ref<string>('all')
const filterIso = ref<string | number>('all')
const filterExpired = ref<string>('all')

const uniqueIsos = computed(() => {
  const isos = filmTypes.value.map(ft => ft.iso)
  return [...new Set(isos)].sort((a, b) => a - b)
})

const filteredFilmTypes = computed(() => {
  return filmTypes.value.filter(ft => {
    if (filterFormat.value !== 'all' && ft.format !== filterFormat.value) return false
    if (filterIso.value !== 'all' && ft.iso !== Number(filterIso.value)) return false
    if (filterExpired.value !== 'all') {
      const expired = new Date(ft.expiration_date) < new Date()
      if (filterExpired.value === 'expired' && !expired) return false
      if (filterExpired.value === 'fresh' && expired) return false
    }
    return true
  })
})

const resetFilters = () => {
  filterFormat.value = 'all'
  filterIso.value = 'all'
  filterExpired.value = 'all'
}

const isExpired = (dateStr: string) => new Date(dateStr) < new Date()

const filtered35mmCount = computed(() => {
  return filteredFilmTypes.value
    .filter(ft => ft.format === '35mm')
    .reduce((sum, ft) => sum + ft.quantity, 0)
})

const filtered120mmCount = computed(() => {
  return filteredFilmTypes.value
    .filter(ft => ft.format === '120mm')
    .reduce((sum, ft) => sum + ft.quantity, 0)
})

// History filtering state
const histFilterCamera = ref<string>('all')
const histFilterFilm = ref<string>('all')
const histFilterLab = ref<string>('all')
const histFilterStart = ref<string>('')
const histFilterEnd = ref<string>('')

// Dynamic unique list of cameras in history
const uniqueHistCameras = computed(() => {
  const models = historyRolls.value.map(r => r.model)
  return [...new Set(models)].sort()
})

// Dynamic unique list of film types in history
const uniqueHistFilms = computed(() => {
  const films = historyRolls.value.map(r => r.film_name)
  return [...new Set(films)].sort()
})

// Dynamic unique list of labs in history
const uniqueHistLabs = computed(() => {
  const labs = historyRolls.value.map(r => r.lab_name).filter(Boolean) as string[]
  return [...new Set(labs)].sort()
})

// Filtered history rolls list
const filteredHistoryRolls = computed(() => {
  return historyRolls.value.filter(r => {
    if (histFilterCamera.value !== 'all' && r.model !== histFilterCamera.value) return false
    if (histFilterFilm.value !== 'all' && r.film_name !== histFilterFilm.value) return false
    if (histFilterLab.value !== 'all' && r.lab_name !== histFilterLab.value) return false
    if (histFilterStart.value && r.load_date < histFilterStart.value) return false
    if (histFilterEnd.value && r.end_date > histFilterEnd.value) return false
    return true
  })
})

const resetHistFilters = () => {
  histFilterCamera.value = 'all'
  histFilterFilm.value = 'all'
  histFilterLab.value = 'all'
  histFilterStart.value = ''
  histFilterEnd.value = ''
}

// History counters that adjust to the filters
const filteredHistTotalCount = computed(() => filteredHistoryRolls.value.length)
const filteredHist35mmCount = computed(() => filteredHistoryRolls.value.filter(r => r.format === '35mm').length)
const filteredHist120mmCount = computed(() => filteredHistoryRolls.value.filter(r => r.format === '120mm').length)

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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

const createFilmType = async (payload: { name: string; iso: number; format: string; expiration_date: string; quantity: number }) => {
  try { await post('/film-types', payload); showFilmTypeModal.value = false; await refreshData() }
  catch (err) { handleError((err as Error).message) }
}

const updateFilmTypeQuantity = async (id: number, quantity: number) => {
  try { await put(`/film-types/${id}/quantity`, { quantity }); await refreshData() }
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

const updateNasBackup = async (payload: { id: number; uploaded_to_nas: boolean }) => {
  try { await put(`/rolls/${payload.id}/nas-backup`, { uploaded_to_nas: payload.uploaded_to_nas }); await refreshData() }
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
        <button type="button" class="btn" :class="{ active: currentTab === 'cameras' }" @click="currentTab = 'cameras'">
          Cameras
        </button>
        <button type="button" class="btn" :class="{ active: currentTab === 'inventory' }" @click="currentTab = 'inventory'">
          Inventory
          <span class="count">{{ filmTypes.reduce((sum, ft) => sum + (ft.quantity || 0), 0) }}</span>
        </button>
        <button type="button" class="btn" :class="{ active: currentTab === 'development' }" @click="currentTab = 'development'">
          Development
          <span v-if="developmentRolls.length" class="count">{{ developmentRolls.length }}</span>
        </button>
        <button type="button" class="btn" :class="{ active: currentTab === 'history' }" @click="currentTab = 'history'">
          History
          <span v-if="historyRolls.length" class="count">{{ historyRolls.length }}</span>
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
    </template>

    <!-- Inventory tab -->
    <template v-else-if="currentTab === 'inventory'">
      <section class="inventory-section">
        <h2 class="inventory-title">Film Roll Inventory (at Home)</h2>

        <!-- Filters bar -->
        <div class="filter-bar">
          <div class="filters-left">
            <div class="filter-group">
              <label class="filter-label" for="filter-format">Format</label>
              <select id="filter-format" v-model="filterFormat" class="filter-select">
                <option value="all">All Formats</option>
                <option value="35mm">35mm</option>
                <option value="120mm">120mm</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="filter-iso">ISO</label>
              <select id="filter-iso" v-model="filterIso" class="filter-select">
                <option value="all">All ISOs</option>
                <option v-for="iso in uniqueIsos" :key="iso" :value="iso">ISO {{ iso }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="filter-expired">Status</label>
              <select id="filter-expired" v-model="filterExpired" class="filter-select">
                <option value="all">All Status</option>
                <option value="fresh">Fresh Film</option>
                <option value="expired">Expired Film</option>
              </select>
            </div>
            <button
              v-if="filterFormat !== 'all' || filterIso !== 'all' || filterExpired !== 'all'"
              class="btn btn-sm btn-ghost reset-btn"
              type="button"
              @click="resetFilters"
            >
              Reset Filters
            </button>
          </div>

          <!-- Stats right -->
          <div class="filters-stats">
            <div class="stat-badge format-35">
              <span class="stat-label">35mm</span>
              <span class="stat-value">{{ filtered35mmCount }}</span>
            </div>
            <div class="stat-badge format-120">
              <span class="stat-label">120mm</span>
              <span class="stat-value">{{ filtered120mmCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="filteredFilmTypes.length" class="film-grid">
          <div v-for="ft in filteredFilmTypes" :key="ft.id" class="film-card">
            <div class="film-card__header">
              <span class="film-card__tag format-tag">{{ ft.format }}</span>
              <span class="film-card__tag iso-tag">ISO {{ ft.iso }}</span>
              <span v-if="isExpired(ft.expiration_date)" class="film-card__tag expired-tag">Expired</span>
            </div>
            <div class="film-card__body">
              <h3 class="film-card__name">{{ ft.name }}</h3>
              <p class="film-card__expires">Expires: {{ fmt(ft.expiration_date) }}</p>
            </div>
            <div class="film-card__actions">
              <div class="quantity-controller">
                <button class="qty-btn" type="button" @click="updateFilmTypeQuantity(ft.id, Math.max(0, ft.quantity - 1))" :disabled="ft.quantity <= 0">−</button>
                <span class="qty-display">{{ ft.quantity }} {{ ft.quantity === 1 ? 'roll' : 'rolls' }}</span>
                <button class="qty-btn" type="button" @click="updateFilmTypeQuantity(ft.id, ft.quantity + 1)">+</button>
              </div>
              <div class="delete-action">
                <template v-if="filmTypeDeleteConfirm !== ft.id">
                  <button class="btn btn-sm btn-ghost" type="button" @click="filmTypeDeleteConfirm = ft.id">Delete</button>
                </template>
                <template v-else>
                  <div class="delete-confirm-row">
                    <span class="confirm-text">Sure?</span>
                    <button class="btn btn-sm btn-danger" type="button" @click="deleteFilmType(ft.id)">Yes</button>
                    <button class="btn btn-sm btn-ghost" type="button" @click="filmTypeDeleteConfirm = null">No</button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="empty">No film types match your filters.</p>
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
      <section class="history-section">
        <!-- History Filters bar -->
        <div class="filter-bar">
          <div class="filters-left">
            <div class="filter-group">
              <label class="filter-label" for="hist-camera">Camera</label>
              <select id="hist-camera" v-model="histFilterCamera" class="filter-select">
                <option value="all">All Cameras</option>
                <option v-for="model in uniqueHistCameras" :key="model" :value="model">{{ model }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="hist-film">Film Type</label>
              <select id="hist-film" v-model="histFilterFilm" class="filter-select">
                <option value="all">All Film Types</option>
                <option v-for="film in uniqueHistFilms" :key="film" :value="film">{{ film }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="hist-lab">Lab</label>
              <select id="hist-lab" v-model="histFilterLab" class="filter-select">
                <option value="all">All Labs</option>
                <option v-for="lab in uniqueHistLabs" :key="lab" :value="lab">{{ lab }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="hist-start">Shot From</label>
              <input id="hist-start" v-model="histFilterStart" type="date" class="filter-input" />
            </div>
            <div class="filter-group">
              <label class="filter-label" for="hist-end">Shot To</label>
              <input id="hist-end" v-model="histFilterEnd" type="date" class="filter-input" />
            </div>
            <button
              v-if="histFilterCamera !== 'all' || histFilterFilm !== 'all' || histFilterLab !== 'all' || histFilterStart || histFilterEnd"
              class="btn btn-sm btn-ghost reset-btn"
              type="button"
              @click="resetHistFilters"
            >
              Reset Filters
            </button>
          </div>

          <!-- Stats right -->
          <div class="filters-stats">
            <div class="stat-badge format-total">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ filteredHistTotalCount }}</span>
            </div>
            <div class="stat-badge format-35">
              <span class="stat-label">35mm</span>
              <span class="stat-value">{{ filteredHist35mmCount }}</span>
            </div>
            <div class="stat-badge format-120">
              <span class="stat-label">120mm</span>
              <span class="stat-value">{{ filteredHist120mmCount }}</span>
            </div>
          </div>
        </div>

        <HistoryTable :rolls="filteredHistoryRolls" @update-nas-backup="updateNasBackup" />
      </section>
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

/* Film roll inventory */
.inventory-section {
  margin-top: 8px;
}

.inventory-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #111;
  margin: 0 0 20px;
}

.film-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.film-card {
  background: #fff;
  border: 2px solid #111;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 4px 4px 0 #111;
}

.film-card__header {
  display: flex;
  gap: 8px;
}

.film-card__tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1.5px solid #111;
}

.format-tag {
  background: #e0f2fe;
  color: #0369a1;
}

.iso-tag {
  background: #fef3c7;
  color: #d97706;
}

.film-card__body {
  flex-grow: 1;
}

.film-card__name {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  color: #111;
}

.film-card__expires {
  margin: 0;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.film-card__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1.5px dashed #ccc;
  padding-top: 14px;
}

.quantity-controller {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.qty-btn {
  background: #fff;
  border: 2px solid #111;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #111;
  transition: transform 0.05s, box-shadow 0.05s;
}

.qty-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #111;
}

.qty-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #111;
}

.qty-btn:disabled {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}

.qty-display {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #111;
}

.delete-action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.delete-confirm-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.confirm-text {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #c0392b;
  margin-right: 4px;
}

/* Filters bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  background: #fff;
  border: 2px solid #111;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 4px 4px 0 #111;
}

.filters-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filters-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 6px 16px;
  min-width: 80px;
  box-shadow: 2px 2px 0 #111;
}

.stat-badge.format-35 {
  background: #e0f2fe;
}

.stat-badge.format-120 {
  background: #fef3c7;
}

.stat-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #555;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 900;
  color: #111;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
}

.filter-select {
  background: #f5f5f3;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 8px 12px;
  color: #111;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
}

.reset-btn {
  height: 38px;
  display: flex;
  align-items: center;
}

.expired-tag {
  background: #ffe0e0;
  color: #c0392b;
  border-color: #c0392b;
}

.stat-badge.format-total {
  background: #f3f4f6;
}

.filter-input {
  background: #f5f5f3;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 8px 12px;
  color: #111;
  font-size: 13px;
  font-weight: 700;
  outline: none;
}
</style>
