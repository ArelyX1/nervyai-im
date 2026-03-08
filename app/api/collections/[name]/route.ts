import { NextResponse } from "next/server"
import { stateDb } from "@/lib/state-db"

type Params = { params: Promise<{ name: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { name } = await params
    let items = stateDb.list(name)
    if (name === "accounts") {
      items = (items as { id?: string }[]).filter((i) => i && i.id !== "simuser")
    }
    return NextResponse.json(items)
  } catch (e) {
    console.error("GET /api/collections", e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { name } = await params
    const item = (await req.json()) as Record<string, unknown>
    if (name === "accounts" && item?.id) {
      const id = String(item.id).trim().toLowerCase()
      ;(item as Record<string, string>).id = id
      if (id === "simuser") {
        stateDb.remove(name, id)
        return NextResponse.json({ ok: true, item: null })
      }
    }
    const saved = stateDb.upsert(name, item)
    return NextResponse.json({ ok: true, item: saved })
  } catch (e) {
    console.error("POST /api/collections", e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
