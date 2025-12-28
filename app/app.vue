<script setup lang="ts">
import SensorChart from "~/components/lineChart.vue"

interface SensorReading {
  device: string
  datetime: string
  humidity: number
  temperature: number
  timestamp: number
}

const { data: response } = await useFetch("/api/sensor", {
  timeout: 10000,
  query: {
    from: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    to: new Date().toISOString()
  }
})

const sensorData = ref<SensorReading[]>([])
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
const maxDataPoints = 300 // 5 minutes at 1 reading/sec

watchEffect(() => {
  if (response.value?.data) {
    const data = response.value.data
    sensorData.value = data.sort((a, b) => a.timestamp - b.timestamp)
  }
})

if (process.client) {
  let eventSource: EventSource | null = null

  onMounted(() => {
    eventSource = new EventSource('/api/stream')

    eventSource.onopen = () => {
      console.log('Connected to live sensor stream')
      connectionStatus.value = 'connected'
    }

    eventSource.onmessage = (event) => {
      try {
        const newReading: SensorReading = JSON.parse(event.data)

        const exists = sensorData.value.some(r =>
          r.timestamp === newReading.timestamp &&
          r.datetime === newReading.datetime
        )

        if (!exists) {
          sensorData.value.push(newReading)

          if (sensorData.value.length > maxDataPoints) {
            sensorData.value.shift()
          }
        }
      } catch (error) {
        console.error('Error parsing sensor data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      connectionStatus.value = 'error'
    }
  })

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close()
      connectionStatus.value = 'disconnected'
    }
  })
}
</script>

<template>
  <div class="min-h-screen max-w-screen p-10 bg-slate-950">
    <!-- Connection Status -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-white">Live Sensor Data</h2>
        <p class="text-slate-400 text-sm mt-1">
          {{ sensorData.length }} readings (last 5 minutes)
        </p>
      </div>

      <div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900">
        <div
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-green-500 animate-pulse': connectionStatus === 'connected',
            'bg-yellow-500 animate-pulse': connectionStatus === 'connecting',
            'bg-red-500': connectionStatus === 'error',
            'bg-gray-500': connectionStatus === 'disconnected'
          }"
        />
        <span class="text-sm text-slate-300 capitalize">{{ connectionStatus }}</span>
      </div>
    </div>

    <!-- Chart -->
    <SensorChart v-if="sensorData.length > 0" :data="sensorData" />

    <!-- Loading State -->
    <div v-else class="p-10 rounded-lg bg-slate-900 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p class="text-xl text-white">Loading sensor data...</p>
    </div>

    <!-- Latest Reading Card -->
    <div v-if="sensorData.length > 0" class="mt-6 grid lg:grid-cols-2 gap-6">
      <div class="p-6 rounded-lg bg-slate-900 shadow-lg shadow-slate-900/60">
        <p class="text-lg font-semibold text-slate-300 mb-2">Latest Reading</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-6xl font-bold text-red-400">
              {{ sensorData[sensorData.length - 1].temperature }}°C
            </p>
            <p class="text-sm text-slate-400 mt-2">Temperature</p>
          </div>
          <div>
            <p class="text-6xl font-bold text-blue-400">
              {{ sensorData[sensorData.length - 1].humidity }}%
            </p>
            <p class="text-sm text-slate-400 mt-2">Humidity</p>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-4">
          {{ new Date(sensorData[sensorData.length - 1].datetime).toLocaleString() }}
        </p>
      </div>

      <!-- Statistics -->
      <div class="p-6 rounded-lg bg-slate-900 shadow-lg shadow-slate-900/60">
        <p class="text-lg font-semibold text-slate-300 mb-4">Statistics</p>
        <div class="space-y-3">
          <div>
            <p class="text-sm text-slate-400">Avg Temperature</p>
            <p class="text-2xl font-bold text-red-400">
              {{ (sensorData.reduce((sum, r) => sum + r.temperature, 0) / sensorData.length).toFixed(1) }}°C
            </p>
          </div>
          <div>
            <p class="text-sm text-slate-400">Avg Humidity</p>
            <p class="text-2xl font-bold text-blue-400">
              {{ (sensorData.reduce((sum, r) => sum + r.humidity, 0) / sensorData.length).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
