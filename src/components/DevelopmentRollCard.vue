<script setup lang="ts">
import { computed, ref } from 'vue'

type DevelopmentRoll = {
  id: number
  camera_id: number
  film_type_id: number
  model: string
  film_name: string
  iso: number
  format: string
  load_date: string
  end_date: string
  lab_name: string | null
  sent_to_lab_date: string | null
  scanned_at: string | null
}

const props = defineProps({
  roll: {
    type: Object as () => DevelopmentRoll,
    required: true,
  },
})

const emit = defineEmits<{
  sendToLab: [payload: { id: number; lab_name: string; sent_to_lab_date: string }]
  markScanned: [payload: { id: number; scanned_at: string }]
}>()

const labName = ref(props.roll.lab_name ?? '')
const sentDate = ref(props.roll.sent_to_lab_date ?? new Date().toISOString().slice(0, 10))
const scannedDate = ref(new Date().toISOString().slice(0, 10))

const isAtLab = computed(() => !!props.roll.lab_name && !!props.roll.sent_to_lab_date)

const submitSendToLab = () => {
  if (!labName.value || !sentDate.value) return
  emit('sendToLab', { id: props.roll.id, lab_name: labName.value, sent_to_lab_date: sentDate.value })
}

const submitMarkScanned = () => {
  if (!scannedDate.value) return
  emit('markScanned', { id: props.roll.id, scanned_at: scannedDate.value })
}
</script>

<template>
  <article class="card">
    <header class="card__header">
      <div class="card__meta">
        <p class="label">{{ roll.format }}</p>
        <h3>{{ roll.model }}</h3>
        <p class="film">{{ roll.film_name }} · ISO {{ roll.iso }}</p>
      </div>
      <span class="badge" :class="isAtLab ? 'at-lab' : 'awaiting'">
        {{ isAtLab ? 'At the Lab' : 'Awaiting Lab' }}
      </span>
    </header>

    <div class="dates">
      <span>Loaded {{ roll.load_date }}</span>
      <span class="sep">·</span>
      <span>Finished {{ roll.end_date }}</span>
    </div>

    <!-- Phase 1: not yet sent to lab -->
    <div v-if="!isAtLab" class="section">
      <p class="section-title">Send to Lab</p>
      <label>
        Lab name
        <input v-model="labName" type="text" placeholder="e.g. Carmencita Lab" />
      </label>
      <label>
        Date sent
        <input v-model="sentDate" type="date" />
      </label>
      <button
        class="action-btn"
        type="button"
        :disabled="!labName || !sentDate"
        @click="submitSendToLab"
      >
        Send to Lab
      </button>
    </div>

    <!-- Phase 2: at lab, awaiting scan -->
    <div v-else class="section">
      <p class="section-title">At the Lab</p>
      <div class="lab-info">
        <span class="lab-name">🧪 {{ roll.lab_name }}</span>
        <span class="lab-date">Sent {{ roll.sent_to_lab_date }}</span>
      </div>
      <label>
        Scanned / received date
        <input v-model="scannedDate" type="date" />
      </label>
      <button
        class="action-btn done"
        type="button"
        :disabled="!scannedDate"
        @click="submitMarkScanned"
      >
        ✓ Mark as Scanned
      </button>
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
  gap: 12px;
  box-shadow: 0 18px 48px rgba(5, 11, 28, 0.6);
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.label {
  margin: 0;
  color: #8ea6e8;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h3 {
  margin: 4px 0 2px;
  color: #f2f6ff;
  font-size: 16px;
}

.film {
  margin: 0;
  color: #b5c4e8;
  font-size: 13px;
}

.badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.awaiting {
  background: #2a3a5e;
  color: #9fb8f0;
}

.badge.at-lab {
  background: #1e3b2f;
  color: #6edc9e;
}

.dates {
  color: #8094bb;
  font-size: 12px;
  display: flex;
  gap: 6px;
}

.sep {
  opacity: 0.4;
}

.section {
  background: #0c1628;
  border: 1px solid #1e2c4c;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6c8dff;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #c7d4ff;
}

input {
  background: #0b1324;
  border: 1px solid #2a3958;
  border-radius: 8px;
  padding: 8px 10px;
  color: #f2f6ff;
  font-size: 14px;
}

.action-btn {
  align-self: flex-start;
  background: #6c8dff;
  color: #0b1324;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.action-btn.done {
  background: #3ecf78;
}

.action-btn:disabled {
  background: #2e3c59;
  color: #7a8cb0;
  cursor: not-allowed;
}

.lab-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lab-name {
  font-weight: 600;
  color: #f2f6ff;
}

.lab-date {
  font-size: 12px;
  color: #8094bb;
}
</style>
