import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = 8788;
const redirectUri = `http://127.0.0.1:${port}/oauth/youtube/callback`;
const scopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function userEnv(name) {
  if (process.platform !== "win32") {
    return "";
  }

  try {
    return execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `[Environment]::GetEnvironmentVariable('${name}', 'User')`,
    ]).then(({ stdout }) => stdout.trim());
  } catch {
    return "";
  }
}

async function envValue(name) {
  return process.env[name] || (await userEnv(name));
}

async function setUserEnv(name, value) {
  await execFileAsync("setx", [name, value], { windowsHide: true });
}

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

async function exchangeCode({ clientId, clientSecret, code }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchChannelId(accessToken) {
  const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Channel lookup failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  const json = await response.json();
  return json?.items?.[0]?.id;
}

async function main() {
  const clientId = await envValue("GOOGLE_CLIENT_ID");
  const clientSecret = await envValue("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be present.");
  }

  const state = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  console.log("YouTube OAuth helper ready");
  console.log(`callback: ${redirectUri}`);
  console.log("Open this URL in your browser and approve access:");
  console.log(authUrl.toString());
  console.log("Waiting for callback...");

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", redirectUri);
      if (url.pathname !== "/oauth/youtube/callback") {
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

      const token = await exchangeCode({ clientId, clientSecret, code });
      if (!token.refresh_token) {
        throw new Error("Google did not return a refresh token. Confirm prompt=consent and access_type=offline.");
      }

      const channelId = await fetchChannelId(token.access_token);
      if (!channelId) {
        throw new Error("Could not resolve YouTube channel id.");
      }

      await setUserEnv("YOUTUBE_REFRESH_TOKEN", token.refresh_token);
      await setUserEnv("YOUTUBE_CHANNEL_ID", channelId);

      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("YouTube connected. You can close this browser tab and return to Codex.");
      console.log("YouTube OAuth complete");
      console.log("YOUTUBE_REFRESH_TOKEN: stored in user env");
      console.log("YOUTUBE_CHANNEL_ID: stored in user env");
      console.log("No token values printed.");
      server.close();
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("YouTube OAuth failed. Return to Codex for details.");
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
