<script setup lang="ts">
type HistoryRoll = {
  id: number
  model: string
  film_name: string
  iso: number
  format: string
  load_date: string
  end_date: string
  lab_name: string | null
  sent_to_lab_date: string | null
  scanned_at: string
}

defineProps({
  rolls: {
    type: Array as () => HistoryRoll[],
    required: true,
  },
})

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<template>
  <div class="history">
    <div v-if="!rolls.length" class="empty">No completed rolls yet.</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>Camera</th>
          <th>Film</th>
          <th>ISO</th>
          <th>Format</th>
          <th>Loaded</th>
          <th>Finished</th>
          <th>Lab</th>
          <th>Sent</th>
          <th>Scanned</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll in rolls" :key="roll.id">
          <td class="camera">{{ roll.model }}</td>
          <td>{{ roll.film_name }}</td>
          <td class="center">{{ roll.iso }}</td>
          <td class="center">{{ roll.format }}</td>
          <td class="muted">{{ fmt(roll.load_date) }}</td>
          <td class="muted">{{ fmt(roll.end_date) }}</td>
          <td>
            <span v-if="roll.lab_name" class="lab-pill">🧪 {{ roll.lab_name }}</span>
            <span v-else class="na">—</span>
          </td>
          <td class="muted">{{ roll.sent_to_lab_date ? fmt(roll.sent_to_lab_date) : '—' }}</td>
          <td>
            <span class="scanned-badge">✓ {{ fmt(roll.scanned_at) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.history {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #1e2c4c;
}

.empty {
  text-align: center;
  color: #6b7fa8;
  padding: 48px 0;
  font-size: 15px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead tr {
  background: #0c1628;
}

th {
  text-align: left;
  padding: 10px 14px;
  color: #6c8dff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 1px solid #1e2c4c;
}

tbody tr {
  border-bottom: 1px solid #131e34;
  transition: background 0.12s;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: #0f1b30;
}

td {
  padding: 10px 14px;
  color: #dce8ff;
  white-space: nowrap;
}

td.camera {
  font-weight: 600;
}

td.center {
  text-align: center;
}

td.muted {
  color: #6b7fa8;
}

.na {
  color: #3a4e6e;
}

.lab-pill {
  background: #1e3040;
  color: #92c5f8;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 12px;
}

.scanned-badge {
  background: #1a3028;
  color: #5ddb94;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 600;
}
</style>
