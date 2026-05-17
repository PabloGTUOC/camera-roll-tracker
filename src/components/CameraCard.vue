<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps({
  camera: {
    type: Object as () => { id: number; model: string; supported_film_type: string },
    required: true,
  },
  activeRoll: {
    type: Object as () => {
      id: number
      film_name: string
      iso: number
      load_date: string
      expiration_date: string
    } | null,
    default: null,
  },
})

const emit = defineEmits<{
  finishRoll: [payload: { id: number; end_date: string }]
  deleteCamera: [id: number]
}>()

const endDate = ref('')
const confirmDelete = ref(false)

const expirationLabel = computed(() => {
  if (!props.activeRoll) return ''
  const expired = new Date(props.activeRoll.expiration_date) < new Date()
  return expired ? 'Expired film' : 'Fresh film'
})

const rollDescription = computed(() => {
  if (!props.activeRoll) return 'No active roll loaded.'
  return `${props.activeRoll.film_name} · ISO ${props.activeRoll.iso}`
})

const submitFinish = () => {
  if (!props.activeRoll || !endDate.value) return
  emit('finishRoll', { id: props.activeRoll.id, end_date: endDate.value })
  endDate.value = ''
}
</script>

<template>
  <article class="card">
    <header class="card__header">
      <div>
        <p class="label">{{ camera.supported_film_type }}</p>
        <h3>{{ camera.model }}</h3>
      </div>
      <div class="header-right">
        <div v-if="activeRoll" class="chip" :class="{ expired: expirationLabel === 'Expired film' }">
          {{ expirationLabel }}
        </div>
        <div class="delete-wrap">
          <button
            v-if="!confirmDelete"
            class="delete-btn"
            type="button"
            :title="activeRoll ? 'Cannot delete: camera has an active roll' : 'Delete camera'"
            :disabled="!!activeRoll"
            @click="confirmDelete = true"
          >
            ✕
          </button>
          <div v-else class="confirm-inline">
            <button class="confirm-yes" type="button" @click="emit('deleteCamera', camera.id)">Yes</button>
            <button class="confirm-no" type="button" @click="confirmDelete = false">No</button>
          </div>
        </div>
      </div>
    </header>

    <p class="roll">{{ rollDescription }}</p>
    <p v-if="activeRoll" class="meta">Loaded on {{ activeRoll.load_date }}</p>
    <p v-if="activeRoll" class="meta">Expires on {{ activeRoll.expiration_date }}</p>
    <p v-else class="meta">Waiting for the next roll.</p>

    <div v-if="activeRoll" class="finish">
      <label class="finish-label" for="end-date">End date</label>
      <input id="end-date" v-model="endDate" type="date" />
      <button :disabled="!endDate" type="button" class="finish-btn" @click="submitFinish">Finish roll</button>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: #fff;
  border: 2px solid #111;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 4px 4px 0 #111;
}

.card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.label {
  margin: 0;
  color: #666;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
}

h3 {
  margin: 4px 0 0;
  color: #111;
  font-size: 20px;
  font-weight: 800;
}

.roll {
  margin: 4px 0 0;
  font-weight: 700;
  font-size: 15px;
  color: #111;
}

.meta {
  color: #555;
  margin: 1px 0;
  font-size: 14px;
}

/* Badge */
.chip {
  border: 2px solid #111;
  color: #111;
  background: #fff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chip.expired {
  border-color: #c0392b;
  color: #c0392b;
}

/* Finish roll */
.finish {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

.finish-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
}

input[type='date'] {
  background: #f5f5f3;
  color: #111;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 600;
}

.finish-btn {
  align-self: flex-start;
  background: #111;
  color: #fff;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  box-shadow: 3px 3px 0 #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.finish-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #111;
}

.finish-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  color: #888;
  box-shadow: none;
  cursor: not-allowed;
}

/* Delete */
.delete-btn {
  background: transparent;
  color: #bbb;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, border-color 0.15s;
}

.delete-btn:hover:not(:disabled) {
  color: #c0392b;
  border-color: #c0392b;
}

.delete-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.confirm-inline {
  display: flex;
  gap: 4px;
}

.confirm-yes, .confirm-no {
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid #111;
  box-shadow: 2px 2px 0 #111;
}

.confirm-yes {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
  box-shadow: 2px 2px 0 #7a1a11;
}

.confirm-no {
  background: #fff;
  color: #111;
}
</style>
