import { NextResponse } from "next/server"
import { stateDb } from "@/lib/state-db"

type Params = { params: Promise<{ name: string; id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { name, id } = await params
    if (name === "accounts" && id === "simuser") {
      return NextResponse.json({}, { status: 404 })
    }
    const lookupId = name === "accounts" ? id.trim().toLowerCase() : id
    const item = stateDb.get(name, lookupId)
    if (!item) return NextResponse.json({}, { status: 404 })
    return NextResponse.json(item)
  } catch (e) {
    console.error("GET /api/collections/name/id", e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { name, id } = await params
    stateDb.remove(name, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/collections/name/id", e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
