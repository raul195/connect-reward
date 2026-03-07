import { config } from "dotenv";
config({ path: ".env.local" });
import { clearDemoData } from "../lib/demo-data/clear";

clearDemoData()
  .then(() => console.log("Done"))
  .catch(console.error);
