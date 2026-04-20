# jwt_crack.js

> **Blazing-fast HS256 JWT secret brute-forcer — zero dependencies, pure Node.js.**

---

##  Performance

Built on Node.js's native `crypto` module with no external dependencies. No overhead from third-party JWT libraries just raw HMAC-SHA256 comparisons at full speed.

---

##  Requirements

- Node.js `v14+`
- No `npm install` needed — uses only built-ins

---

##  Usage

```bash
node jwt_crack.js <jwt_token> <wordlist_file>
```

### Example

```bash
node jwt_crack.js \
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.\
KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30 \
  list.txt
```

### Output

```
[*] Loaded 4512 candidates from list.txt
[*] Starting brute-force...

[+] Secret found: 'a-string-secret-at-least-256-bits-long'
[+] Payload: {
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true,
  "iat": 1516239022
}
[*] Tried 42 candidates in 0.003s
```

---

## How It Works

```
JWT = base64url(header) . base64url(payload) . base64url(signature)
```

For each secret candidate from the wordlist:

```
HMAC-SHA256(header.payload, candidate) == signature  →   Found
```

The script manually implements the full JWT verification process without any library:

| Step | What happens |
|------|-------------|
| 1 Parse | Split token into `header`, `payload`, `signature` |
| 2 Validate | Decode header, confirm `alg: HS256` |
| 3 Crack | For each word: compute HMAC-SHA256, compare signature |
| 4 Report | Print secret, decoded payload, and timing stats |

---

##  Project Structure

```
jwt_crack.js      # Main script — the only file you need
list.txt          # Your wordlist (one secret per line)
```

---

## Disclaimer

This tool is intended for **authorized security testing and CTF challenges only**.  
Do not use against systems you do not own or have explicit permission to test.

---