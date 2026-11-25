import { readFile } from "node:fs/promises";
import { createInterface, emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
const owner = JSON.parse(
  (
    await readFile(
      new URL("../.local/knowledge-owner.json", import.meta.url),
      "utf8",
    )
  ).replace(/^\uFEFF/, ""),
);
const ask = (prompt) =>
  new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout });
    rl.question(prompt, (value) => {
      rl.close();
      resolve(value.trim());
    });
  });
async function secret() {
  if (!stdin.isTTY)
    throw new Error(
      "Run Setup-Knowledge-Staff.cmd in an interactive terminal.",
    );
  stdout.write("Private passphrase (14+ characters, hidden): ");
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const done = () => {
      stdin.off("keypress", key);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const key = (s, k = {}) => {
      if (k.ctrl && k.name === "c") {
        done();
        reject(new Error("Cancelled"));
      } else if (k.name === "return") {
        done();
        resolve(value);
      } else if (k.name === "backspace") {
        value = value.slice(0, -1);
      } else if (!k.ctrl && s && value.length < 256) {
        value += s;
      }
    };
    stdin.on("keypress", key);
  });
}
try {
  console.log(
    "Local staff setup — named people only. A separate reviewer must approve an editor’s work.",
  );
  const action = await ask("Action (add / disable): ");
  const username = await ask("Username (lowercase English, 3-50 characters): ");
  let payload = { action, username };
  if (action === "add")
    payload = {
      ...payload,
      displayName: await ask("Staff name: "),
      professionalRole: await ask(
        "Professional role / review responsibility: ",
      ),
      role: await ask("Access role (editor / reviewer): "),
      password: await secret(),
    };
  const r = await fetch("http://127.0.0.1:43129/__staff", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${owner.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  payload.password = undefined;
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error);
  }
  console.log(
    "Staff account updated. Open http://127.0.0.1:43129/staff/ to sign in.",
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
