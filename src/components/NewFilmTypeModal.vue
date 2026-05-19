<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  create: [payload: { name: string; iso: number; format: string; expiration_date: string; quantity: number }]
}>()

const name = ref('')
const iso = ref<number | null>(null)
const format = ref('')
const expirationDate = ref('')
const quantity = ref<number>(0)

const submit = () => {
  if (!name.value || !iso.value || !format.value || !expirationDate.value) return
  emit('create', {
    name: name.value,
    iso: Number(iso.value),
    format: format.value,
    expiration_date: expirationDate.value,
    quantity: Number(quantity.value || 0)
  })
  name.value = ''
  iso.value = null
  format.value = ''
  expirationDate.value = ''
  quantity.value = 0
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <header>
        <h2>New Film Type</h2>
        <button class="close-btn" type="button" @click="emit('close')">✕</button>
      </header>
      <form class="form" @submit.prevent="submit">
        <label class="field-label">
          Name
          <input v-model="name" placeholder="Portra 400" />
        </label>
        <label class="field-label">
          ISO
          <input v-model.number="iso" type="number" min="1" placeholder="400" />
        </label>
        <label class="field-label">
          Format
          <select v-model="format">
            <option value="" disabled>Select format</option>
            <option value="35mm">35mm</option>
            <option value="120mm">120mm</option>
          </select>
        </label>
        <label class="field-label">
          Expiration date
          <input v-model="expirationDate" type="date" />
        </label>
        <label class="field-label">
          Quantity (rolls in stock)
          <input v-model.number="quantity" type="number" min="0" placeholder="0" />
        </label>
        <button class="submit-btn" type="submit" :disabled="!name || !iso || !format || !expirationDate">
          Save film type
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
  width: min(440px, 100%);
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

input, select {
  background: #f5f5f3;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111;
  font-size: 14px;
  font-weight: 600;
}

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
