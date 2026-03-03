type AuthTokenGetter = () => Promise<string | null>;

let getTokenFn: AuthTokenGetter = async () => null;

export function setAuthTokenGetter(fn: AuthTokenGetter) {
  getTokenFn = fn;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await getTokenFn();
  } catch {
    return null;
  }
}
