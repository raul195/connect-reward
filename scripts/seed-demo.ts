import { config } from "dotenv";
config({ path: ".env.local" });
import { seedDemoData } from "../lib/demo-data/seed";

seedDemoData()
  .then(() => console.log("Done"))
  .catch(console.error);
