<template>
  <div class="card">
    <h3>{{ camera.model }}</h3>
    <p>Supported film: {{ camera.supported_film_type }}</p>

    <div v-if="activeRoll" class="roll">
      <p><strong>Loaded film:</strong> {{ activeRoll.film_name }} (ISO {{ activeRoll.iso }})</p>
      <p><strong>Load date:</strong> {{ activeRoll.load_date }}</p>
      <p :class="{ expired: isExpired }">
        <strong>Expiration:</strong> {{ activeRoll.expiration_date }}
        <span v-if="isExpired">(Expired)</span>
      </p>
      <div class="finish">
        <label>
          End date:
          <input v-model="endDate" type="date" />
        </label>
        <button @click="finish">Finish Roll</button>
      </div>
    </div>
    <p v-else>No active roll</p>

    <div v-if="camera.finished_rolls?.length" class="history">
      <p class="history-title">Finished rolls</p>
      <ul>
        <li v-for="roll in camera.finished_rolls" :key="roll.id">
          <span>{{ roll.film_name }} (ISO {{ roll.iso }})</span>
          <span>Loaded: {{ roll.load_date }}</span>
          <span>Finished: {{ roll.end_date }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  camera: { type: Object, required: true },
});
const emit = defineEmits(["finish-roll"]);

const endDate = ref(new Date().toISOString().slice(0, 10));

const activeRoll = computed(() => props.camera.active_roll);

const isExpired = computed(() => {
  if (!activeRoll.value?.expiration_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return activeRoll.value.expiration_date < today;
});

const finish = () => {
  if (!endDate.value || !activeRoll.value?.id) return;
  emit("finish-roll", { rollId: activeRoll.value.id, endDate: endDate.value });
};
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.finish {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.expired {
  color: #c00;
}

.history {
  margin-top: 12px;
}

.history-title {
  font-weight: bold;
  margin-bottom: 6px;
}

.history ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.history li {
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 6px;
}
</style>
