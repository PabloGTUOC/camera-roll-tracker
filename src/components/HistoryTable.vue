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
  uploaded_to_nas: number
}

import { ref, computed } from 'vue'

const props = defineProps({
  rolls: {
    type: Array as () => HistoryRoll[],
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update-nas-backup', payload: { id: number; uploaded_to_nas: boolean }): void
}>()

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

type SortField = 'model' | 'film_name' | 'load_date'
const sortKey = ref<SortField>('load_date')
const sortOrder = ref<'asc' | 'desc'>('asc')

const handleSort = (field: SortField) => {
  if (sortKey.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = field
    sortOrder.value = 'asc'
  }
}

const sortedRolls = computed(() => {
  return [...props.rolls].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    // Fallback for null/undefined values
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (sortKey.value === 'load_date') {
      const dateA = new Date(valA).getTime()
      const dateB = new Date(valB).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    } else {
      // String/alphabetical comparison
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      if (strA < strB) return sortOrder.value === 'asc' ? -1 : 1
      if (strA > strB) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    }
  })
})
</script>

<template>
  <div class="history">
    <div v-if="!rolls.length" class="empty">No completed rolls yet.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="sortable" @click="handleSort('model')">
              Camera
              <span class="sort-icon" v-if="sortKey === 'model'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="sortable" @click="handleSort('film_name')">
              Film
              <span class="sort-icon" v-if="sortKey === 'film_name'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th>ISO</th>
            <th>Format</th>
            <th class="sortable" @click="handleSort('load_date')">
              Loaded
              <span class="sort-icon" v-if="sortKey === 'load_date'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th>Finished</th>
            <th>Lab</th>
            <th>Sent</th>
            <th>Scanned</th>
            <th>NAS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="roll in sortedRolls" :key="roll.id">
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
            <td>
              <button
                type="button"
                class="nas-btn"
                :class="{ 'is-uploaded': !!roll.uploaded_to_nas }"
                @click="emit('update-nas-backup', { id: roll.id, uploaded_to_nas: !roll.uploaded_to_nas })"
              >
                <span v-if="roll.uploaded_to_nas">✓ Backup</span>
                <span v-else>✗ Missing</span>
              </button>
            </td>
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
  font-size: 11px;
  background: #fff;
}

thead tr { background: #f5f5f3; }

th {
  text-align: left;
  padding: 8px 8px;
  color: #111;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 2px solid #111;
}

th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s, color 0.1s;
}

th.sortable:hover {
  background: #eaeaea;
  color: #000;
}

.sort-icon {
  display: inline-block;
  margin-left: 2px;
  font-size: 8px;
  vertical-align: middle;
}

tbody tr {
  border-bottom: 1px solid #e8e8e8;
  transition: background 0.1s;
}

tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: #fafaf8; }

td {
  padding: 6px 8px;
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
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  background: #fff;
}

.scanned-badge {
  border: 1.5px solid #1a7a44;
  color: #1a7a44;
  border-radius: 12px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
}

.nas-btn {
  background: #fff;
  border: 1.5px solid #111;
  border-radius: 12px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  white-space: nowrap;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.nas-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 #111;
}

.nas-btn:active {
  transform: translate(0, 0);
  box-shadow: none;
}

.nas-btn.is-uploaded {
  border-color: #1a7a44;
  color: #1a7a44;
  background: #eafaf1;
}

.nas-btn:not(.is-uploaded) {
  border-color: #c0392b;
  color: #c0392b;
  background: #fdf2f2;
}
</style>
