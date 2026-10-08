/** Browser-side fetch helper for our JSON APIs. Shows server error messages; redirects on expired sessions. */
export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers },
      credentials: "same-origin",
    });
  } catch {
    throw new ClientApiError(0, "Network error. Please check your connection and try again.");
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status}).`;
    // Plain module (no router hook available): use a full navigation to recover the session.
    if (response.status === 401 && typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?expired=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    if (response.status === 403 && /change your temporary password/i.test(message) && typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/change-password";
    }
    throw new ClientApiError(response.status, message);
  }
  return data;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
