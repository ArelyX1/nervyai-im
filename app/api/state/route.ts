import { NextResponse } from "next/server"
import { stateDb } from "@/lib/state-db"

export async function GET() {
  try {
    const st = stateDb.getState()
    return NextResponse.json(st)
  } catch (e) {
    console.error("GET /api/state", e)
    return NextResponse.json({ error: "Failed to read state" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    stateDb.saveState(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/state", e)
    return NextResponse.json({ error: "Failed to write state" }, { status: 500 })
  }
}
