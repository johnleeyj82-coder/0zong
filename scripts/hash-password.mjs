// Usage: npm run hash-password -- "내 비밀번호"
// Prints an OWNER_PASSWORD_HASH line for .env.local. The password itself is never stored.
import { randomBytes, scryptSync } from "node:crypto";
const pw = process.argv[2];
if (!pw) { console.error('사용법: npm run hash-password -- "비밀번호"'); process.exit(1); }
const salt = randomBytes(16);
console.log(`OWNER_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${scryptSync(pw, salt, 32).toString("hex")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("hex")}`);
