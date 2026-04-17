import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnv = path.join(__dirname, ".env");
const rootEnv = path.join(__dirname, "..", ".env");

if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
} else {
    dotenv.config();
}
