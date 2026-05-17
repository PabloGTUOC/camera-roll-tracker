<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  cameras: {
    type: Array as () => { id: number; model: string; supported_film_type: string }[],
    required: true,
  },
  filmTypes: {
    type: Array as () => { id: number; name: string; iso: number; format: string; expiration_date: string }[],
    required: true,
  },
  activeRollMap: {
    type: Object as () => Map<number, unknown>,
    required: true,
  },
})

const emit = defineEmits<{
  close: []
  create: [payload: { camera_id: number; film_type_id: number; load_date: string }]
}>()

const cameraId = ref<number | null>(null)
const filmTypeId = ref<number | null>(null)
const loadDate = ref(new Date().toISOString().slice(0, 10))

const selectedCamera = computed(() => props.cameras.find((c) => c.id === cameraId.value) || null)

const eligibleFilmTypes = computed(() => {
  if (!selectedCamera.value) return []
  return props.filmTypes.filter((film) => film.format === selectedCamera.value?.supported_film_type)
})

const selectedFilm = computed(() => props.filmTypes.find((f) => f.id === filmTypeId.value) || null)

const isExpired = computed(() => {
  if (!selectedFilm.value) return false
  return new Date(selectedFilm.value.expiration_date) < new Date()
})

const hasActiveRoll = computed(() => {
  if (!selectedCamera.value) return false
  return props.activeRollMap.has(selectedCamera.value.id)
})

watch(selectedCamera, () => { filmTypeId.value = null })

const submit = () => {
  if (!cameraId.value || !filmTypeId.value || !loadDate.value || hasActiveRoll.value) return
  emit('create', { camera_id: cameraId.value, film_type_id: filmTypeId.value, load_date: loadDate.value })
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <header>
        <h2>Load Roll</h2>
        <button class="close-btn" type="button" @click="emit('close')">✕</button>
      </header>
      <form class="form" @submit.prevent="submit">
        <label class="field-label">
          Camera
          <select v-model.number="cameraId">
            <option :value="null" disabled>Select camera</option>
            <option v-for="camera in cameras" :key="camera.id" :value="camera.id">
              {{ camera.model }} ({{ camera.supported_film_type }})
            </option>
          </select>
        </label>

        <label class="field-label">
          Film type
          <select v-model.number="filmTypeId" :disabled="!selectedCamera">
            <option :value="null" disabled>Select film type</option>
            <option v-for="film in eligibleFilmTypes" :key="film.id" :value="film.id">
              {{ film.name }} · ISO {{ film.iso }} ({{ film.format }})
            </option>
          </select>
          <small v-if="selectedCamera && !eligibleFilmTypes.length" class="hint">
            No film types match {{ selectedCamera.supported_film_type }}
          </small>
        </label>

        <label class="field-label">
          Load date
          <input v-model="loadDate" type="date" />
        </label>

        <p v-if="isExpired" class="notice expired">This film is expired but can still be loaded.</p>
        <p v-if="hasActiveRoll" class="notice warning">This camera already has an active roll.</p>

        <button class="submit-btn" type="submit" :disabled="!cameraId || !filmTypeId || !loadDate || hasActiveRoll">
          Load into camera
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 10;
}

.modal {
  background: #fff;
  border: 2px solid #111;
  border-radius: 12px;
  padding: 24px;
  width: min(520px, 100%);
  box-shadow: 6px 6px 0 #111;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.close-btn {
  background: transparent;
  border: 1.5px solid #ccc;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover { border-color: #111; color: #111; }

.form { display: flex; flex-direction: column; gap: 14px; }

.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
}

select, input {
  background: #f5f5f3;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111;
  font-size: 14px;
  font-weight: 600;
}

select:disabled { opacity: 0.5; }

.hint { color: #888; font-size: 11px; margin: 0; }

.notice {
  border: 2px solid #111;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.notice.expired { background: #fff7e0; color: #7a4f00; border-color: #d4a017; }
.notice.warning { background: #fff0f0; color: #7a1a1a; border-color: #c0392b; }

.submit-btn {
  background: #111;
  color: #fff;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  box-shadow: 3px 3px 0 #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.submit-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #111;
}

.submit-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  color: #888;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
