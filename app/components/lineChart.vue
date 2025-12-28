<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SensorReading {
  device: string
  datetime: string
  humidity: number
  temperature: number
  timestamp: number
}

interface Props {
  data: SensorReading[]
}

const props = defineProps<Props>()

const chartData = computed(() => {
  const sortedData = [...props.data]

  return {
    labels: sortedData.map(reading => {
      const date = new Date(reading.datetime)
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sortedData.map(reading => reading.temperature),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      },
      {
        label: 'Humidity (%)',
        data: sortedData.map(reading => reading.humidity),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }
    ]
  }
})

const getScaleWithPadding = (values: number[], paddingPercent: number = 10) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const padding = range * (paddingPercent / 100)

  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding)
  }
}

const chartOptions = computed(() => {
  const temperatures = props.data.map(r => r.temperature)
  const humidities = props.data.map(r => r.humidity)

  const tempScale = getScaleWithPadding(temperatures, 15)
  const humidityScale = getScaleWithPadding(humidities, 15)

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 14
          },
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Line Chart',
        color: '#e5e7eb',
        font: {
          size: 17,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              label += context.datasetIndex === 0 ? '°C' : '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 20,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: tempScale.min,
        max: tempScale.max,
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#ef4444',
          font: {
            size: 13,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#ef4444',
          font: {
            size: 12
          },
          stepSize: 0.2,
          callback: function(value: any) {
            return value + '°C';
          }
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: humidityScale.min,
        max: humidityScale.max,
        title: {
          display: true,
          text: 'Humidity (%)',
          color: '#3b82f6',
          font: {
            size: 13,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#3b82f6',
          font: {
            size: 12
          },
          stepSize: 0.5,
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  }
})
</script>

<template>
  <div class="w-full h-96 bg-slate-900 p-5 rounded-lg shadow-lg shadow-slate-900/60">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
