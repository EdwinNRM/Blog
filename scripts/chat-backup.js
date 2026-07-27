const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ENCRYPTION_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

async function supabaseFetch(method, endpoint, body) {
  const url = SUPABASE_URL + "/rest/v1/" + endpoint;
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: "Bearer " + SUPABASE_SERVICE_KEY,
    Accept: "application/json",
  };
  const opts = { method, headers };
  if (body) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  console.log(`  ${method} ${endpoint} → ${res.status}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) return res.json();
  return null;
}

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log("Chat backup starting...");

  // 1. Fetch messages
  console.log("Fetching messages...");
  let messages;
  try {
    messages = await supabaseFetch(
      "GET",
      "chat_messages?select=*&order=created_at.asc"
    );
  } catch (e) {
    console.error("Failed to fetch messages:", e.message);
    messages = [];
  }

  if (!messages || messages.length === 0) {
    console.log("No messages to backup.");
  } else {
    console.log(`Got ${messages.length} messages.`);

    // 2. Encrypt
    console.log("Encrypting...");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify({ date: today, messages }, null, 2);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const blob = Buffer.concat([iv, authTag, encrypted]);

    // 3. Write backup file
    const backupDir = path.resolve(__dirname, "..", "_data", "chat", "backups");
    fs.mkdirSync(backupDir, { recursive: true });
    const filePath = path.join(backupDir, `${today}.enc`);
    fs.writeFileSync(filePath, blob);
    console.log(`Backup written: ${filePath}`);
  }

  // 4. Always clear messages table
  console.log("Clearing messages table...");
  try {
    // Use a dummy filter to satisfy PostgREST and delete all rows
    await supabaseFetch(
      "DELETE",
      "chat_messages?id=neq.00000000-0000-0000-0000-000000000000"
    );
    console.log("Messages table cleared.");
  } catch (e) {
    console.error("Failed to clear messages:", e.message);
  }

  // 5. Always clean stale users
  console.log("Cleaning stale users...");
  try {
    const twoMinAgo = new Date(Date.now() - 120000).toISOString();
    await supabaseFetch(
      "DELETE",
      "chat_users?last_seen=lt." + encodeURIComponent(twoMinAgo)
    );
    console.log("Stale users cleaned.");
  } catch (e) {
    console.log("Stale user cleanup skipped:", e.message);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
