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

watch(selectedCamera, () => {
  filmTypeId.value = null
})

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
        <button class="ghost" type="button" @click="emit('close')">Close</button>
      </header>
      <form class="form" @submit.prevent="submit">
        <label>
          Camera
          <select v-model.number="cameraId">
            <option :value="null" disabled>Select camera</option>
            <option v-for="camera in cameras" :key="camera.id" :value="camera.id">
              {{ camera.model }} ({{ camera.supported_film_type }})
            </option>
          </select>
        </label>

        <label>
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

        <label>
          Load date
          <input v-model="loadDate" type="date" />
        </label>

        <p v-if="isExpired" class="expired">This film is expired but can still be loaded.</p>
        <p v-if="hasActiveRoll" class="warning">This camera already has an active roll.</p>

        <button class="primary" type="submit" :disabled="!cameraId || !filmTypeId || !loadDate || hasActiveRoll">
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
  background: rgba(5, 8, 17, 0.7);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 10;
}

.modal {
  background: #0f1a30;
  border: 1px solid #203459;
  border-radius: 12px;
  padding: 18px;
  width: min(520px, 100%);
  color: #f4f7ff;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

select,
input {
  background: #0b1324;
  border: 1px solid #2a3958;
  border-radius: 10px;
  padding: 10px 12px;
  color: #f2f6ff;
}

button {
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}

button.primary {
  background: #6c8dff;
  color: #0b1324;
}

button.ghost {
  background: transparent;
  color: #d5e2ff;
}

button:disabled {
  background: #2e3c59;
  color: #94a2c5;
  cursor: not-allowed;
}

.expired {
  background: #ffe0e6;
  color: #481420;
  padding: 8px 10px;
  border-radius: 10px;
  margin: 0;
}

.warning {
  background: #f6dcae;
  color: #2e1d07;
  padding: 8px 10px;
  border-radius: 10px;
  margin: 0;
}

.hint {
  color: #b5c4e8;
}
</style>
