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

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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
      <div>
        <p class="label">{{ roll.format }}</p>
        <h3>{{ roll.model }}</h3>
        <p class="film">{{ roll.film_name }} · ISO {{ roll.iso }}</p>
      </div>
      <span class="badge" :class="isAtLab ? 'at-lab' : 'awaiting'">
        {{ isAtLab ? 'At the Lab' : 'Awaiting Lab' }}
      </span>
    </header>

    <div class="dates">
      <span>Loaded {{ fmt(roll.load_date) }}</span>
      <span class="sep">·</span>
      <span>Finished {{ fmt(roll.end_date) }}</span>
    </div>

    <!-- Phase 1: send to lab -->
    <div v-if="!isAtLab" class="section">
      <p class="section-title">Send to Lab</p>
      <label class="field-label">
        Lab name
        <input v-model="labName" type="text" placeholder="e.g. Carmencita Lab" />
      </label>
      <label class="field-label">
        Date sent
        <input v-model="sentDate" type="date" />
      </label>
      <button class="action-btn" type="button" :disabled="!labName || !sentDate" @click="submitSendToLab">
        Send to Lab
      </button>
    </div>

    <!-- Phase 2: at lab, awaiting scan -->
    <div v-else class="section">
      <p class="section-title">At the Lab</p>
      <div class="lab-info">
        <span class="lab-name">{{ roll.lab_name }}</span>
        <span class="lab-date">Sent {{ fmt(roll.sent_to_lab_date!) }}</span>
      </div>
      <label class="field-label">
        Scanned / received date
        <input v-model="scannedDate" type="date" />
      </label>
      <button class="action-btn done" type="button" :disabled="!scannedDate" @click="submitMarkScanned">
        ✓ Mark as Scanned
      </button>
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
  gap: 10px;
  box-shadow: 4px 4px 0 #111;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
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
  margin: 4px 0 2px;
  color: #111;
  font-size: 20px;
  font-weight: 800;
}

.film {
  margin: 0;
  color: #555;
  font-size: 14px;
  font-weight: 600;
}

.badge {
  flex-shrink: 0;
  border: 2px solid #111;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #fff;
  color: #111;
}

.badge.at-lab {
  border-color: #1a7a44;
  color: #1a7a44;
}

.dates {
  color: #888;
  font-size: 12px;
  display: flex;
  gap: 6px;
}

.sep { opacity: 0.4; }

.section {
  background: #f5f5f3;
  border: 2px solid #111;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #555;
}

input {
  background: #fff;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 8px 10px;
  color: #111;
  font-size: 14px;
  font-weight: 600;
}

.action-btn {
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

.action-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #111;
}

.action-btn.done {
  background: #1a7a44;
  border-color: #1a7a44;
  box-shadow: 3px 3px 0 #0d4226;
}

.action-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  color: #888;
  box-shadow: none;
  cursor: not-allowed;
}

.lab-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lab-name { font-weight: 700; font-size: 15px; color: #111; }
.lab-date { font-size: 12px; color: #777; }
</style>
