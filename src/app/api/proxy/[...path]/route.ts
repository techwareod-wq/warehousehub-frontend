import { proxyRequest } from "@/core/api/proxy"

type Ctx = { params: Promise<{ path: string[] }> }

async function handle(req: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export const dynamic = "force-dynamic"
export const GET = handle
export const POST = handle
