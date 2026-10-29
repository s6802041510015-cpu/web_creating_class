export async function verifyLineIdToken(idToken, channelId = process.env.LINE_CHANNEL_ID) {
  if (!channelId) throw new Error("LINE_CHANNEL_ID is not configured");
  if (typeof idToken !== "string" || idToken.length < 100 || idToken.length > 8192) return null;

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  const profile = await response.json();
  if (profile?.aud !== channelId || typeof profile.sub !== "string" || !/^U[0-9a-f]{32}$/.test(profile.sub)) return null;
  return {
    userId: profile.sub,
    displayName: typeof profile.name === "string" ? profile.name.slice(0, 100) : "ผู้เรียน LINE",
  };
}
