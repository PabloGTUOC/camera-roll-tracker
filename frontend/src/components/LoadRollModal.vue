<template>
  <div class="modal">
    <div class="panel">
      <h3>Load Roll</h3>
      <label>
        Camera
        <select v-model.number="cameraId" @change="selectedFilmTypeId = ''">
          <option value="">Select camera</option>
          <option
            v-for="camera in availableCameras"
            :key="camera.id"
            :value="camera.id"
          >
            {{ camera.model }} ({{ camera.supported_film_type }})
          </option>
        </select>
        <small v-if="!availableCameras.length">All cameras already have active rolls.</small>
      </label>
      <label>
        Film type
        <select v-model.number="selectedFilmTypeId">
          <option value="">Select film</option>
          <option
            v-for="film in compatibleFilmTypes"
            :key="film.id"
            :value="film.id"
          >
            {{ film.name }} (ISO {{ film.iso }}, {{ film.format }})
          </option>
        </select>
      </label>
      <label>
        Load date
        <input v-model="loadDate" type="date" />
      </label>
      <div class="actions">
        <button @click="$emit('close')">Cancel</button>
        <button :disabled="loading" @click="save">Load</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  loading: Boolean,
  cameras: { type: Array, default: () => [] },
  filmTypes: { type: Array, default: () => [] },
});
const emit = defineEmits(["save", "close"]);

const cameraId = ref("");
const selectedFilmTypeId = ref("");
const loadDate = ref(new Date().toISOString().slice(0, 10));

const availableCameras = computed(() => props.cameras.filter((c) => !c.active_roll));

const compatibleFilmTypes = computed(() => {
  const camera = props.cameras.find((c) => c.id === Number(cameraId.value));
  if (!camera) return [];
  return props.filmTypes.filter((f) => f.format === camera.supported_film_type);
});

const save = () => {
  if (!cameraId.value || !selectedFilmTypeId.value || !loadDate.value) return;
  emit("save", {
    camera_id: Number(cameraId.value),
    film_type_id: Number(selectedFilmTypeId.value),
    load_date: loadDate.value,
  });
  cameraId.value = "";
  selectedFilmTypeId.value = "";
  loadDate.value = new Date().toISOString().slice(0, 10);
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
