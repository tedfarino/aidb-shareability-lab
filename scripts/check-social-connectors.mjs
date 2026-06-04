import { execFileSync } from "node:child_process";

const connectorChecks = [
  {
    channel: "LinkedIn",
    publish: "LinkedIn Posts API",
    metrics: "LinkedIn social actions / metadata",
    appEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    tokenEnv: ["LINKEDIN_ACCESS_TOKEN"],
    identityEnv: ["LINKEDIN_AUTHOR_URN"],
    scopes: ["w_member_social", "r_member_social"],
  },
  {
    channel: "X",
    publish: "X API post create",
    metrics: "X post analytics",
    appEnv: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
    tokenEnv: ["X_REFRESH_TOKEN"],
    identityEnv: ["X_USER_ID"],
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  },
  {
    channel: "YouTube",
    publish: "YouTube Data API videos.insert",
    metrics: "YouTube Analytics API",
    appEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    tokenEnv: ["YOUTUBE_REFRESH_TOKEN"],
    identityEnv: ["YOUTUBE_CHANNEL_ID"],
    scopes: ["youtube.upload", "yt-analytics.readonly"],
  },
];

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

function presence(names) {
  return Object.fromEntries(names.map((name) => [name, envValue(name) ? "present" : "missing"]));
}

function allPresent(statusMap) {
  return Object.values(statusMap).every((status) => status === "present");
}

const results = connectorChecks.map((connector) => {
  const appStatus = presence(connector.appEnv);
  const tokenStatus = presence(connector.tokenEnv);
  const identityStatus = presence(connector.identityEnv);
  const appReady = allPresent(appStatus);
  const tokenReady = allPresent(tokenStatus);
  const identityReady = allPresent(identityStatus);
  const ready = appReady && tokenReady && identityReady;

  return {
    ...connector,
    appStatus,
    tokenStatus,
    identityStatus,
    readiness: {
      appReady,
      tokenReady,
      identityReady,
    },
    status: ready ? "ready" : "not connected",
  };
});

console.log("Growth Engineer Dashboard connector check");
for (const result of results) {
  console.log(`${result.channel}: ${result.status}`);
  console.log(`  publish: ${result.publish}`);
  console.log(`  metrics: ${result.metrics}`);
  console.log(`  scopes: ${result.scopes.join(", ")}`);
  for (const [name, status] of Object.entries(result.appStatus)) {
    console.log(`  ${name}: ${status}`);
  }
  for (const [name, status] of Object.entries(result.tokenStatus)) {
    console.log(`  ${name}: ${status}`);
  }
  for (const [name, status] of Object.entries(result.identityStatus)) {
    console.log(`  ${name}: ${status}`);
  }
}
