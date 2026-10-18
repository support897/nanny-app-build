// Kept as a named entry for the store variant. The variant step itself now lives
// in sync-web.mjs (the Actions workflow already calls it), so this simply runs it.
import { execSync } from "node:child_process";
execSync("node sync-web.mjs", { stdio: "inherit" });
console.log("STORE VARIANT READY: store/www carries no demo caregivers");
