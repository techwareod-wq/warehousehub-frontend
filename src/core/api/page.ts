/** The backend's shared pagination shape (1-based). */
export interface PageNetwork<T> {
  items: T[] | null
  page: number
  limit: number
  total: number
}

export interface Page<T> {
  items: T[]
  page: number
  limit: number
  total: number
  pages: number
}

export function mapPage<N, E>(page: PageNetwork<N>, map: (n: N) => E): Page<E> {
  const limit = page.limit || 1
  return {
    items: (page.items ?? []).map(map),
    page: page.page,
    limit: page.limit,
    total: page.total,
    pages: Math.max(1, Math.ceil(page.total / limit)),
  }
}
