import { NextResponse } from "next/server"
import { stateDb } from "@/lib/state-db"

export async function POST() {
  try {
    const seed = stateDb.resetToSeed()
    return NextResponse.json({ ok: true, seed })
  } catch (e) {
    console.error("POST /api/reset", e)
    return NextResponse.json({ error: "failed to reset" }, { status: 500 })
  }
}
