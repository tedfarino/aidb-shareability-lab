import crypto from "node:crypto";
import http from "node:http";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = 8789;
const redirectUri = `http://127.0.0.1:${port}/oauth/linkedin/callback`;
const scopes = ["openid", "profile", "w_member_social"];

function userEnv(name) {
  if (process.platform !== "win32") {
    return "";
  }

  try {
    return execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `[Environment]::GetEnvironmentVariable('${name}', 'User')`,
      ],
      { encoding: "utf8", windowsHide: true },
    ).trim();
  } catch {
    return "";
  }
}

function envValue(name) {
  return process.env[name] || userEnv(name);
}

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

async function setUserEnv(name, value) {
  await execFileAsync("setx", [name, value], { windowsHide: true });
}

async function exchangeCode({ clientId, clientSecret, code }) {
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchAuthorUrn(accessToken) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn user lookup failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  const json = await response.json();
  if (!json?.sub) {
    throw new Error("LinkedIn userinfo response did not include a subject id.");
  }

  return `urn:li:person:${json.sub}`;
}

async function main() {
  const clientId = envValue("LINKEDIN_CLIENT_ID");
  const clientSecret = envValue("LINKEDIN_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be present.");
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scopes.join(" "));

  console.log("LinkedIn OAuth helper ready");
  console.log(`callback: ${redirectUri}`);
  console.log(`scopes: ${scopes.join(", ")}`);
  console.log("Open this URL in your browser and approve access:");
  console.log(authUrl.toString());
  console.log("Waiting for callback...");

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", redirectUri);
      if (url.pathname !== "/oauth/linkedin/callback") {
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
      if (!token.access_token) {
        throw new Error("LinkedIn did not return an access token.");
      }

      const authorUrn = await fetchAuthorUrn(token.access_token);
      await setUserEnv("LINKEDIN_ACCESS_TOKEN", token.access_token);
      if (token.refresh_token) {
        await setUserEnv("LINKEDIN_REFRESH_TOKEN", token.refresh_token);
      }
      await setUserEnv("LINKEDIN_AUTHOR_URN", authorUrn);

      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("LinkedIn connected. You can close this browser tab and return to Codex.");
      console.log("LinkedIn OAuth complete");
      console.log("LINKEDIN_ACCESS_TOKEN: stored in user env");
      console.log(`LINKEDIN_REFRESH_TOKEN: ${token.refresh_token ? "stored in user env" : "not returned"}`);
      console.log("LINKEDIN_AUTHOR_URN: stored in user env");
      console.log("No token values printed.");
      server.close();
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("LinkedIn OAuth failed. Return to Codex for details.");
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
