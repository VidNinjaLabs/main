// Stub file for compatibility - VidNinja API doesn't use tokens

export async function getApiToken(): Promise<string | null> {
  return null;
}

export function setApiToken(_token: string): void {
  // No-op (token parameter prefixed with _ to satisfy linter)
}
