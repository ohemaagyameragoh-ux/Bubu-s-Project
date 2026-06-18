// Local development Postgres, with no Docker and no system install.
// embedded-postgres ships a real Postgres binary through npm and runs it on a local port.
// The data lives in ./.pgdata and survives across runs, so this is a normal local database.
// When you move to Neon, only DATABASE_URL and DIRECT_URL change. Nothing else does.
import { existsSync } from "node:fs";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = join(process.cwd(), ".pgdata");
const PORT = 5432;
const DB_NAME = "app";

function makeInstance() {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: true,
  });
}

async function start() {
  const pg = makeInstance();
  const initialised = existsSync(join(DATA_DIR, "PG_VERSION"));
  if (!initialised) {
    console.log("Initialising local Postgres data directory at .pgdata ...");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
    console.log(`Created database "${DB_NAME}".`);
  } catch {
    // Database already exists. That is expected on later runs.
  }
  console.log(`Local Postgres is running on port ${PORT}.`);
  console.log(`Connection string: postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`);
}

async function stop() {
  const pg = makeInstance();
  await pg.stop();
  console.log("Local Postgres stopped.");
}

const cmd = process.argv[2];
const run = cmd === "stop" ? stop : start;
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
