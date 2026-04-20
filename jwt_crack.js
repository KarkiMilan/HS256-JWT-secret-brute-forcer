const fs = require("fs");
const crypto = require("crypto");

function base64urlDecode(str) {
  // Convert base64url into base64, then decode
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function base64urlEncode(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function trySecret(headerPayload, expectedSig, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(headerPayload);
  const sig = base64urlEncode(hmac.digest());
  return sig === expectedSig;
}

function crackJWT(token, wordlistPath) {
  // Split and validate the JWT
  const parts = token.split(".");
  if (parts.length !== 3) {
    console.error("[-] Invalid JWT format. Expected 3 parts separated by '.'");
    process.exit(1);
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const headerPayload = `${headerB64}.${payloadB64}`;

  // Decode and check algorithm
  let header;
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString("utf8"));
  } catch {
    console.error("[-] Failed to decode JWT header.");
    process.exit(1);
  }

  if (header.alg !== "HS256") {
    console.error(`[-] Unsupported algorithm: ${header.alg}. Only HS256 is supported.`);
    process.exit(1);
  }

  // Decode payload for display
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString("utf8"));
  } catch {
    payload = null;
  }

  // Read wordlist
  if (!fs.existsSync(wordlistPath)) {
    console.error(`[-] Wordlist file not found: ${wordlistPath}`);
    process.exit(1);
  }

  const wordlist = fs.readFileSync(wordlistPath, "utf8").split(/\r?\n/);
  console.log(`[*] Loaded ${wordlist.length} candidates from ${wordlistPath}`);
  console.log(`[*] Starting brute-force...\n`);

  let tried = 0;
  const startTime = Date.now();

  for (const word of wordlist) {
    if (!word) continue; // skip empty lines
    tried++;

    if (trySecret(headerPayload, signatureB64, word)) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[+] Secret found: '${word}'`);
      if (payload) {
        console.log(`[+] Payload: ${JSON.stringify(payload, null, 2)}`);
      }
      console.log(`[*] Tried ${tried} candidates in ${elapsed}s`);
      return;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[-] Secret not found after trying ${tried} candidates in ${elapsed}s`);
}

// --- Entry point ---
const [, , token, wordlistPath] = process.argv;

if (!token || !wordlistPath) {
  console.log("Usage: node jwt_crack.js <jwt_token> <wordlist_file>");
  console.log();
  console.log("Example:");
  console.log(
    "  node jwt_crack.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30 list.txt"
  );
  process.exit(1);
}

crackJWT(token, wordlistPath);