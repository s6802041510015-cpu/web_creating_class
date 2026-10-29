import { OAuth2Client } from "google-auth-library";

let client;

export async function verifyTeacherToken(token) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const allowed = (process.env.TEACHER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!clientId || allowed.length === 0)
    throw new Error("Teacher authentication is not configured");
  if (!client) client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const profile = ticket.getPayload();
  if (
    !profile?.email ||
    profile.email_verified !== true ||
    !allowed.includes(profile.email.toLowerCase())
  )
    return null;
  return {
    sub: profile.sub,
    email: profile.email,
    name: profile.name || profile.email,
  };
}
