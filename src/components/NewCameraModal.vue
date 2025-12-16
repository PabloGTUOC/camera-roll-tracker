<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  create: [payload: { model: string; supported_film_type: string }]
}>()

const model = ref('')
const supportedFilmType = ref('')

const submit = () => {
  if (!model.value || !supportedFilmType.value) return
  emit('create', { model: model.value, supported_film_type: supportedFilmType.value })
  model.value = ''
  supportedFilmType.value = ''
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <header>
        <h2>New Camera</h2>
        <button class="ghost" type="button" @click="emit('close')">Close</button>
      </header>
      <form class="form" @submit.prevent="submit">
        <label>
          Model
          <input v-model="model" placeholder="Pentax K1000" />
        </label>
        <label>
          Supported film type
          <input v-model="supportedFilmType" placeholder="35mm or 120" />
        </label>
        <button class="primary" type="submit" :disabled="!model || !supportedFilmType">Save camera</button>
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
