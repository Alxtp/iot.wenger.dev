import { Container, CosmosClient , Database, SqlQuerySpec} from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

const endpoint = "https://cosno-main-dev.documents.azure.com:443/"
const dbName = "iot"
const containerName = "temperature"

export default defineEventHandler(async (event) => {
  try {
    const credential = new DefaultAzureCredential();
    const client = new CosmosClient({
        endpoint: endpoint,
        aadCredentials: credential
    });

    const database: Database = client.database(dbName);
    const container: Container = database.container(containerName);

    const querySpec: SqlQuerySpec = {
      query: `
      SELECT TOP 1
          c.device,
          c.Body.datetime,
          c.Body.humidity,
          c.Body.temperature,
          c._ts
      FROM c
      ORDER BY c._ts DESC
      `
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      return {
        success: false,
        message: "No data found",
        data: null
      };
    }

    const latestReading = resources[0];

    return {
      success: true,
      data: {
        device: latestReading.device,
        datetime: latestReading.datetime,
        humidity: latestReading.humidity,
        temperature: latestReading.temperature,
        timestamp: latestReading._ts
      }
    };

  } catch (error: any){
    return {
      success: false,
      message: error.message || 'Failed to fetch sensor data',
      data: null
    };
  }
})
