import crypto from "node:crypto";
import http from "node:http";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = 8787;
const redirectUri = `http://127.0.0.1:${port}/oauth/x/callback`;
const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];

function getEnv(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  if (process.platform !== "win32") {
    return "";
  }

  try {
    return execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${name}', 'User')`],
      { encoding: "utf8", windowsHide: true },
    ).trim();
  } catch {
    return "";
  }
}

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

async function setUserEnv(name, value) {
  await execFileAsync("setx", [name, value], { windowsHide: true });
}

async function exchangeCode({ clientId, clientSecret, code, codeVerifier }) {
  const body = formEncode({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: clientId,
  });
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchUserId(accessToken) {
  const response = await fetch("https://api.x.com/2/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`User lookup failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  const json = await response.json();
  return json?.data?.id;
}

async function main() {
  const clientId = getEnv("X_CLIENT_ID");
  const clientSecret = getEnv("X_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID and X_CLIENT_SECRET must be present in this shell.");
  }

  const codeVerifier = base64Url(crypto.randomBytes(48));
  const codeChallenge = base64Url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state = base64Url(crypto.randomBytes(24));

  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("X OAuth helper ready");
  console.log(`callback: ${redirectUri}`);
  console.log("Open this URL in your browser and approve access:");
  console.log(authUrl.toString());
  console.log("Waiting for callback...");

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", redirectUri);
      if (url.pathname !== "/oauth/x/callback") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const error = url.searchParams.get("error");
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      const returnedState = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      if (!code || returnedState !== state) {
        throw new Error("OAuth callback missing code or state mismatch.");
      }

      const token = await exchangeCode({ clientId, clientSecret, code, codeVerifier });
      if (!token.refresh_token) {
        throw new Error("X did not return a refresh token. Confirm offline.access is enabled.");
      }
      const userId = await fetchUserId(token.access_token);
      if (!userId) {
        throw new Error("Could not resolve X user id.");
      }

      await setUserEnv("X_REFRESH_TOKEN", token.refresh_token);
      await setUserEnv("X_USER_ID", userId);

      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("X connected. You can close this browser tab and return to Codex.");
      console.log("X OAuth complete");
      console.log("X_REFRESH_TOKEN: stored in user env");
      console.log("X_USER_ID: stored in user env");
      console.log("No token values printed.");
      server.close();
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("X OAuth failed. Return to Codex for details.");
      console.error(error.message);
      server.close();
      process.exitCode = 1;
    }
  });

  server.listen(port, "127.0.0.1");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
