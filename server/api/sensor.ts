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

    const query = getQuery(event)
    const fromDateTime = query.from ? String(query.from) : null
    const toDateTime = query.to ? String(query.to) : String(new Date().toISOString())

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT ${query.from ? "" : "TOP 1"}
          c.device,
          c.Body.datetime,
          c.Body.humidity,
          c.Body.temperature,
          c._ts
        FROM c
        ${query.from ? "WHERE c.Body.datetime BETWEEN @from AND @to" : ""}
        ORDER BY c._ts DESC
      `,
      parameters: query.from ? [
        { name: "@from", value: fromDateTime },
        { name: "@to", value: toDateTime }
      ] : []
    };

    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources.length === 0) {
      return {
        success: false,
        message: "No data found",
        data: null
      };
    }

    const data = resources.map(reading => ({
      device: reading.device,
      datetime: reading.datetime,
      humidity: reading.humidity,
      temperature: reading.temperature,
      timestamp: reading._ts
    }));

    return {
      success: true,
      query: query,
      data: data
    };

  } catch (error: any){
    return {
      success: false,
      message: error.message || 'Failed to fetch sensor data',
      data: null
    };
  }
})
