// Chat backup script — run daily at 00:00 UTC via GitHub Actions
// Encrypts all messages from today, commits to _data/chat/backups/, then clears tables

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ENCRYPTION_KEY) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, BACKUP_ENCRYPTION_KEY");
  process.exit(1);
}

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

async function main() {
  const today = new Date().toISOString().split("T")[0];

  // Fetch all messages
  const messages = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?select=*&order=created_at.asc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Accept: "application/json",
      },
    }
  ).then((r) => {
    if (!r.ok) throw new Error(`Fetch messages failed: ${r.status}`);
    return r.json();
  });

  if (!messages || messages.length === 0) {
    console.log("No messages to backup.");
    // Still clean up stale users
    await cleanupStaleUsers();
    return;
  }

  // Encrypt
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = JSON.stringify({ date: today, messages }, null, 2);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv (16) + authTag (16) + encrypted data
  const blob = Buffer.concat([iv, authTag, encrypted]);

  // Write backup file
  const backupDir = path.join(__dirname, "..", "_data", "chat", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const filePath = path.join(backupDir, `${today}.enc`);
  fs.writeFileSync(filePath, blob);

  console.log(`Backup written: ${filePath} (${messages.length} messages)`);

  // Clear messages table
  await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
  }).then((r) => {
    if (!r.ok) throw new Error(`Delete messages failed: ${r.status}`);
    console.log("Chat messages table cleared.");
  });

  // Clean up stale users
  await cleanupStaleUsers();
}

async function cleanupStaleUsers() {
  // Delete users not seen in 2 minutes (missed heartbeat)
  const twoMinAgo = new Date(Date.now() - 120000).toISOString();
  await fetch(
    `${SUPABASE_URL}/rest/v1/chat_users?last_seen=lt.${encodeURIComponent(twoMinAgo)}`,
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
    }
  ).then((r) => {
    if (!r.ok) throw new Error(`Cleanup users failed: ${r.status}`);
    console.log("Stale users cleaned up.");
  }).catch(() => {
    // chat_users table may not exist yet
    console.log("No chat_users table or cleanup not needed.");
  });
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
