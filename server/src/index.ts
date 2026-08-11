import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[verdict-api] listening on http://localhost:${config.port}`);
  console.log(`[verdict-api] env: ${config.nodeEnv}`);
});
