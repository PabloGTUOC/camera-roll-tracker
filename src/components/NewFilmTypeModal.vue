<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  create: [payload: { name: string; iso: number; format: string; expiration_date: string }]
}>()

const name = ref('')
const iso = ref<number | null>(null)
const format = ref('')
const expirationDate = ref('')

const submit = () => {
  if (!name.value || !iso.value || !format.value || !expirationDate.value) return
  emit('create', {
    name: name.value,
    iso: Number(iso.value),
    format: format.value,
    expiration_date: expirationDate.value,
  })
  name.value = ''
  iso.value = null
  format.value = ''
  expirationDate.value = ''
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <header>
        <h2>New Film Type</h2>
        <button class="ghost" type="button" @click="emit('close')">Close</button>
      </header>
      <form class="form" @submit.prevent="submit">
        <label>
          Name
          <input v-model="name" placeholder="Portra 400" />
        </label>
        <label>
          ISO
          <input v-model.number="iso" type="number" min="1" />
        </label>
        <label>
          Format
          <input v-model="format" placeholder="35mm or 120" />
        </label>
        <label>
          Expiration date
          <input v-model="expirationDate" type="date" />
        </label>
        <button class="primary" type="submit" :disabled="!name || !iso || !format || !expirationDate">
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
  width: min(440px, 100%);
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
</style>
