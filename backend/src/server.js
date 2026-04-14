import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/api/docs`);
  console.log(`OpenAPI JSON: http://localhost:${config.port}/api/openapi.json`);
});
