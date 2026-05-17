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
    <div v-else class="table-wrap">
      <table class="table">
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
            <td class="bold">{{ roll.model }}</td>
            <td>{{ roll.film_name }}</td>
            <td class="center">{{ roll.iso }}</td>
            <td class="center">{{ roll.format }}</td>
            <td class="muted">{{ fmt(roll.load_date) }}</td>
            <td class="muted">{{ fmt(roll.end_date) }}</td>
            <td>
              <span v-if="roll.lab_name" class="lab-pill">{{ roll.lab_name }}</span>
              <span v-else class="na">—</span>
            </td>
            <td class="muted">{{ roll.sent_to_lab_date ? fmt(roll.sent_to_lab_date) : '—' }}</td>
            <td><span class="scanned-badge">✓ {{ fmt(roll.scanned_at) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.history { }

.empty {
  text-align: center;
  color: #777;
  padding: 48px 0;
  font-size: 15px;
}

.table-wrap {
  overflow-x: auto;
  border: 2px solid #111;
  border-radius: 12px;
  box-shadow: 4px 4px 0 #111;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
}

thead tr { background: #f5f5f3; }

th {
  text-align: left;
  padding: 10px 14px;
  color: #111;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 2px solid #111;
}

tbody tr {
  border-bottom: 1px solid #e8e8e8;
  transition: background 0.1s;
}

tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: #fafaf8; }

td {
  padding: 10px 14px;
  color: #222;
  white-space: nowrap;
}

td.bold { font-weight: 700; }
td.center { text-align: center; }
td.muted { color: #777; }

.na { color: #bbb; }

.lab-pill {
  border: 1.5px solid #111;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
}

.scanned-badge {
  border: 1.5px solid #1a7a44;
  color: #1a7a44;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
}
</style>
