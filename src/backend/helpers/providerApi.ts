// Stub file for compatibility - VidNinja API doesn't use tokens

export async function getApiToken(): Promise<string | null> {
  return null;
}

export function setApiToken(token: string): void {
  // No-op
}
