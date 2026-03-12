import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { MongoClient } from "mongodb";

/**
 * Parse a .env-formatted string into an object mapping variable names to their values.
 *
 * Supports lines with optional leading `export`, skips empty lines and lines starting with `#`,
 * splits each line on the first `=` to separate key and value, trims whitespace, and removes
 * surrounding single or double quotes from values.
 *
 * @param {string} contents - The raw contents of a .env file.
 * @returns {{[key: string]: string}} An object whose keys are environment variable names and values are their corresponding string values.
 */
function parseDotEnv(contents) {
  const out = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Support: export KEY=VALUE
    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed;
    const eq = normalized.indexOf("=");
    if (eq === -1) continue;

    const key = normalized.slice(0, eq).trim();
    let value = normalized.slice(eq + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }
  return out;
}

/**
 * Load key/value pairs from a .env file at the project root into process.env.
 *
 * If a .env file does not exist in the current working directory this function does nothing.
 * For each parsed key:
 * - When process.env.USE_PROCESS_ENV === "1", existing process.env values are preserved (no override).
 * - Otherwise, values from the .env file overwrite process.env; if an existing value differs, a warning is logged.
 */
function loadEnvFromProjectRoot() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const parsed = parseDotEnv(fs.readFileSync(envPath, "utf8"));
  for (const [k, v] of Object.entries(parsed)) {
    // For local troubleshooting, prefer the project's .env by default to avoid
    // confusion from stale shell/session environment variables.
    const preferProcessEnv = process.env.USE_PROCESS_ENV === "1";
    if (preferProcessEnv) {
      if (process.env[k] == null) process.env[k] = v;
      continue;
    }

    if (process.env[k] != null && process.env[k] !== v) {
      console.warn(`Note: overriding existing env var ${k} with value from .env (set USE_PROCESS_ENV=1 to disable).`);
    }
    process.env[k] = v;
  }
}

/**
 * Redacts the password in a MongoDB connection URI for safe logging.
 *
 * @param {string} uri - The MongoDB connection URI.
 * @returns {string} The URI with the password replaced by `"***"`, or `"<invalid MongoDB URI>"` if the input cannot be parsed.
 */
function redactMongoUri(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    // If the URI is syntactically invalid (often due to unescaped special chars),
    // avoid echoing secrets and just return a placeholder.
    return "<invalid MongoDB URI>";
  }
}

loadEnvFromProjectRoot();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("FAIL: MONGODB_URI is not set (check .env).");
  process.exit(1);
}

console.log(`Testing MongoDB connection... uri=${redactMongoUri(uri)}`);

const client = new MongoClient(uri, {
  // Keep feedback fast when the URI is wrong / host is blocked / DNS fails.
  serverSelectionTimeoutMS: 8000,
});

try {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  console.log("OK: Connected and pinged MongoDB successfully.");
  process.exit(0);
} catch (err) {
  const e = /** @type {any} */ (err);
  console.error("FAIL: Could not connect/ping MongoDB.");
  console.error(`Error: ${e?.name ?? "Error"}: ${e?.message ?? String(e)}`);
  console.error("");
  console.error("Common causes:");
  console.error("- Special characters in the username/password must be URL-encoded (e.g. '@' => '%40').");
  console.error("- Atlas Network Access may be blocking your IP address.");
  console.error("- Wrong cluster hostname or DNS issues.");
  process.exit(1);
} finally {
  try {
    await client.close();
  } catch {
    // ignore
  }
}
