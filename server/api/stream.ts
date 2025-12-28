import { EventHubConsumerClient } from '@azure/event-hubs'
import { DefaultAzureCredential } from '@azure/identity'

const eventHubNamespace = "evhns-iott-dev.servicebus.windows.net"
const eventHubName = "evh-iot-dev"
const consumerGroup = "$Default"

export default defineEventHandler(async (event) => {
  const stream = createEventStream(event)

  try {
    const credential = new DefaultAzureCredential()

    const client = new EventHubConsumerClient(
      consumerGroup,
      eventHubNamespace,
      eventHubName,
      credential
    )

    const subscription = client.subscribe({
      processEvents: async (events) => {
        for (const eventData of events) {
          const sensorData = {
            device: "esp32",
            datetime: eventData.body.datetime,
            humidity: eventData.body.humidity,
            temperature: eventData.body.temperature,
            timestamp: Math.floor(Date.now() / 1000)
          }

          await stream.push(JSON.stringify(sensorData))
        }
      },
      processError: async (err) => {
        console.error('Error processing events:', err)
      }
    })

    event.node.req.on('close', async () => {
      await subscription.close()
      await client.close()
    })

    return stream.send()

  } catch (error: any) {
    console.error('Failed to connect to Event Hub:', error)
    throw createError({
      statusCode: 500,
      message: `Event Hub connection failed: ${error.message}`
    })
  }
})
