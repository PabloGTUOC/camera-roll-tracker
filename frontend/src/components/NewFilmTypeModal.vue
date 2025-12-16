<template>
  <div class="modal">
    <div class="panel">
      <h3>New Film Type</h3>
      <label>
        Name
        <input v-model="name" type="text" />
      </label>
      <label>
        ISO
        <input v-model.number="iso" type="number" />
      </label>
      <label>
        Format
        <select v-model="format">
          <option value="">Select format</option>
          <option>35mm</option>
          <option>120</option>
        </select>
      </label>
      <label>
        Expiration date
        <input v-model="expirationDate" type="date" />
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

const name = ref("");
const iso = ref(null);
const format = ref("");
const expirationDate = ref("");

const save = () => {
  if (!name.value || !iso.value || !format.value || !expirationDate.value) return;
  emit("save", {
    name: name.value,
    iso: iso.value,
    format: format.value,
    expiration_date: expirationDate.value,
  });
  name.value = "";
  iso.value = null;
  format.value = "";
  expirationDate.value = "";
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
