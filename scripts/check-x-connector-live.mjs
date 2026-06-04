import { execFileSync } from "node:child_process";

function userEnv(name) {
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

function envValue(name) {
  return process.env[name] || userEnv(name);
}

function setUserEnv(name, value) {
  if (!value || process.platform !== "win32") {
    return;
  }

  execFileSync("setx", [name, value], { encoding: "utf8", windowsHide: true });
}

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

async function refreshXAccessToken() {
  const clientId = envValue("X_CLIENT_ID");
  const clientSecret = envValue("X_CLIENT_SECRET");
  const refreshToken = envValue("X_REFRESH_TOKEN");

  const present = {
    X_CLIENT_ID: Boolean(clientId),
    X_CLIENT_SECRET: Boolean(clientSecret),
    X_REFRESH_TOKEN: Boolean(refreshToken),
    X_USER_ID: Boolean(envValue("X_USER_ID")),
  };

  if (!Object.values(present).every(Boolean)) {
    return {
      ok: false,
      reason: "missing_env",
      present,
    };
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      reason: "refresh_failed",
      status: response.status,
      details: text.slice(0, 300),
      present,
    };
  }

  const token = await response.json();
  if (token.refresh_token) {
    setUserEnv("X_REFRESH_TOKEN", token.refresh_token);
  }

  return {
    ok: true,
    accessToken: token.access_token,
    rotatedRefreshToken: Boolean(token.refresh_token),
    present,
  };
}

async function main() {
  const token = await refreshXAccessToken();

  console.log("Growth Engineer Dashboard X live connector check");
  for (const [name, value] of Object.entries(token.present ?? {})) {
    console.log(`${name}: ${value ? "present" : "missing"}`);
  }

  if (!token.ok) {
    console.log("X OAuth usable: no");
    console.log(`reason: ${token.reason}`);
    if (token.status) {
      console.log(`status: ${token.status}`);
    }
    console.log("No token values printed.");
    process.exit(1);
  }

  const me = await fetch("https://api.x.com/2/users/me", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  if (!me.ok) {
    const text = await me.text();
    console.log("X OAuth usable: no");
    console.log(`reason: user_lookup_failed`);
    console.log(`status: ${me.status}`);
    console.log(text.slice(0, 300));
    console.log("No token values printed.");
    process.exit(1);
  }

  const json = await me.json();
  console.log("X OAuth usable: yes");
  console.log(`user id present: ${json?.data?.id ? "yes" : "no"}`);
  console.log(`refresh token rotated: ${token.rotatedRefreshToken ? "yes" : "no"}`);
  console.log("No token values printed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
