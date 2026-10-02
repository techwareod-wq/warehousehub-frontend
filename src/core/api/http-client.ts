import { ApiError, NetworkError } from "./api-error"
import { isEnvelope } from "./envelope"
import { toQueryString, type Query } from "./query"

/**
 * The generic API client. It knows nothing about features: it sends a
 * request, unwraps the backend envelope and returns the raw `data` typed as
 * the caller's network model. Features turn that network model into their
 * entity model through a mapper (features/<name>/mappers).
 *
 * Where the request goes (the browser proxy or the backend itself) and how
 * it is authenticated is the Transport's job, so the same client code runs in
 * client components and on the server.
 */
export interface Transport {
  /** Absolute or same-origin base, e.g. "/api/proxy" or "https://api.x". */
  baseUrl: string
  /** Extra headers per request (auth, CSRF marker). */
  headers?: () => Promise<Record<string, string>> | Record<string, string>
  /** Default fetch init (cache mode, Next revalidate…). */
  init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }
}

export interface RequestOptions {
  method?: "GET" | "POST"
  query?: Query
  body?: unknown
  signal?: AbortSignal
  /** Per-call override of the transport's Next cache options (server only). */
  next?: { revalidate?: number | false; tags?: string[] }
}

/** The raw outcome of a call: status plus the envelope's parts. */
export interface RawResponse<T> {
  status: number
  ok: boolean
  data: T | undefined
  error?: string
  code?: string
}

export class HttpClient {
  constructor(private readonly transport: Transport) {}

  /** GET → network model. Throws ApiError on any non-2xx. */
  get<T>(path: string, query?: Query, options: Omit<RequestOptions, "method" | "query" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET", query })
  }

  /** POST → network model. Throws ApiError on any non-2xx. */
  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body })
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.send<T>(path, options)
    if (!res.ok) {
      throw new ApiError(res.status, res.error ?? `${options.method ?? "GET"} ${path} failed`, res.code, res.data)
    }
    return res.data as T
  }

  /**
   * Sends without throwing on HTTP status, for callers that branch on it
   * (the public listing answers 200 / 301 / 410 / 404).
   */
  async send<T>(path: string, options: RequestOptions = {}): Promise<RawResponse<T>> {
    const res = await this.fetchRaw(path, options)
    const text = await res.text()
    let parsed: unknown = undefined
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = undefined
      }
    }
    if (isEnvelope(parsed)) {
      return {
        status: res.status,
        ok: res.ok && parsed.success,
        data: parsed.data as T | undefined,
        error: parsed.error,
        code: parsed.code,
      }
    }
    return { status: res.status, ok: res.ok, data: undefined, error: res.ok ? undefined : res.statusText }
  }

  /** Raw fetch for non-JSON answers (CSV export). Throws NetworkError only. */
  async fetchRaw(path: string, options: RequestOptions = {}): Promise<Response> {
    const method = options.method ?? "GET"
    const extra = this.transport.headers ? await this.transport.headers() : {}
    const headers: Record<string, string> = { Accept: "application/json", ...extra }
    if (options.body !== undefined) headers["Content-Type"] = "application/json"
    const init: RequestInit & { next?: RequestOptions["next"] } = {
      ...this.transport.init,
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    }
    if (options.next) {
      init.next = options.next
      delete init.cache
    }
    try {
      return await fetch(`${this.transport.baseUrl}${path}${toQueryString(options.query)}`, init)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err
      throw new NetworkError(`${method} ${path} failed`, err)
    }
  }
}
