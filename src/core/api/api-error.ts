/**
 * Errors raised by the API client. Every non-2xx answer from the backend
 * becomes an ApiError carrying the status and the envelope's machine code
 * (`code`), message and structured `data`; a transport failure becomes a
 * NetworkError.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly data?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = "NetworkError"
  }
}

/** A message fit for a toast, whatever was thrown. */
export function errorMessage(err: unknown, fallback = "Something went wrong — please try again."): string {
  if (err instanceof ApiError && err.code === "access_required") return "Your account hasn't been given access yet — ask the team to turn it on."
  if (err instanceof ApiError && err.code === "feature_not_included") return "That isn't turned on for your account — ask the team to turn it on."
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof NetworkError) return "Can't reach the server — check your connection."
  if (err instanceof Error && err.message) return err.message
  return fallback
}
