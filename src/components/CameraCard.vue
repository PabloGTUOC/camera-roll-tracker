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
}>()

const endDate = ref('')

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
      <div v-if="activeRoll" class="chip" :class="{ expired: expirationLabel === 'Expired film' }">
        {{ expirationLabel }}
      </div>
    </header>

    <p class="roll">{{ rollDescription }}</p>
    <p v-if="activeRoll" class="meta">Loaded on {{ activeRoll.load_date }}</p>
    <p v-if="activeRoll" class="meta">Expires on {{ activeRoll.expiration_date }}</p>
    <p v-else class="meta">Waiting for the next roll.</p>

    <div v-if="activeRoll" class="finish">
      <label class="meta" for="end-date">End date</label>
      <input id="end-date" v-model="endDate" type="date" />
      <button :disabled="!endDate" type="button" @click="submitFinish">Finish roll</button>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: #111c33;
  border: 1px solid #1e2c4c;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 18px 48px rgba(5, 11, 28, 0.6);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

h3 {
  margin: 6px 0 0;
  color: #f2f6ff;
}

.label {
  margin: 0;
  color: #8ea6e8;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.roll {
  margin: 8px 0 0;
  font-weight: 600;
}

.meta {
  color: #b5c4e8;
  margin: 2px 0;
}

.chip {
  background: #1f3055;
  color: #cfe0ff;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
}

.chip.expired {
  background: #ffe0e6;
  color: #481420;
}

.finish {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input[type='date'] {
  background: #0b1324;
  color: #f2f6ff;
  border: 1px solid #2b3a5b;
  border-radius: 8px;
  padding: 8px 10px;
}

button {
  align-self: flex-start;
  background: #6c8dff;
  color: #0b1324;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  background: #3b4865;
  color: #8896b7;
  cursor: not-allowed;
}
</style>
