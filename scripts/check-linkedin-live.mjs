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

async function main() {
  const accessToken = envValue("LINKEDIN_ACCESS_TOKEN");
  const authorUrn = envValue("LINKEDIN_AUTHOR_URN");
  const present = {
    LINKEDIN_CLIENT_ID: Boolean(envValue("LINKEDIN_CLIENT_ID")),
    LINKEDIN_CLIENT_SECRET: Boolean(envValue("LINKEDIN_CLIENT_SECRET")),
    LINKEDIN_ACCESS_TOKEN: Boolean(accessToken),
    LINKEDIN_AUTHOR_URN: Boolean(authorUrn),
  };

  console.log("Growth Engineer Dashboard LinkedIn live connector check");
  for (const [name, value] of Object.entries(present)) {
    console.log(`${name}: ${value ? "present" : "missing"}`);
  }

  if (!Object.values(present).every(Boolean)) {
    console.log("LinkedIn OAuth usable: no");
    console.log("reason: missing_env");
    console.log("No token values printed.");
    process.exit(1);
  }

  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("LinkedIn OAuth usable: no");
    console.log(`reason: user_lookup_failed`);
    console.log(`status: ${response.status}`);
    console.log(text.slice(0, 300));
    console.log("No token values printed.");
    process.exit(1);
  }

  const json = await response.json();
  console.log("LinkedIn OAuth usable: yes");
  console.log(`subject id present: ${json?.sub ? "yes" : "no"}`);
  console.log("No token values printed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
