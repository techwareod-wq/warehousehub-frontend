/**
 * The backend's response envelope (crunch internal/middleware/response.go):
 * every JSON answer is `{success, data}` or `{success: false, error, code, data}`.
 */
export interface EnvelopeNetwork<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export function isEnvelope(v: unknown): v is EnvelopeNetwork<unknown> {
  return typeof v === "object" && v !== null && "success" in v
}
