<template>
  <div class="modal">
    <div class="panel">
      <h3>New Camera</h3>
      <label>
        Model
        <input v-model="model" type="text" />
      </label>
      <label>
        Supported film type
        <select v-model="supportedFilmType">
          <option value="">Select format</option>
          <option>35mm</option>
          <option>120</option>
        </select>
      </label>
      <div class="actions">
        <button @click="$emit('close')">Cancel</button>
        <button :disabled="loading" @click="save">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({ loading: Boolean });
const emit = defineEmits(["save", "close"]);

const model = ref("");
const supportedFilmType = ref("");

const save = () => {
  if (!model.value || !supportedFilmType.value) return;
  emit("save", {
    model: model.value,
    supported_film_type: supportedFilmType.value,
  });
  model.value = "";
  supportedFilmType.value = "";
};
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel {
  background: white;
  padding: 16px;
  border-radius: 6px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
