import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

const reset = "\x1b[0m";
const pastelPink = "\x1b[38;2;255;179;186m";
const pastelGreen = "\x1b[38;2;186;255;201m";
const pastelBlue = "\x1b[38;2;186;225;255m";
const pastelYellow = "\x1b[38;2;255;255;186m";

app.listen(config.port, () => {
  console.log(`${pastelPink}[verdict-api]${reset} ${pastelGreen}listening on http://localhost:${config.port}${reset}`);
  console.log(`${pastelPink}[verdict-api]${reset} ${pastelYellow}env: ${config.nodeEnv}${reset}`);
});
