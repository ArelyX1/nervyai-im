import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { stateDb } from "@/lib/state-db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, pin, state: bodyState, mode } = body ?? {}
    if (!id || !pin) {
      return NextResponse.json({ ok: false, error: "missing id or pin" }, { status: 400 })
    }

    const nid = String(id).trim().toLowerCase()
    const existing = stateDb.get("accounts", nid) as { id: string; pinHash?: string; pin?: string; state?: unknown } | null

    if (existing) {
      if (mode === "create") {
        return NextResponse.json(
          { ok: false, error: "account_exists", message: "Esa cuenta ya existe. Usa Iniciar sesión." },
          { status: 409 }
        )
      }
      const hash = existing.pinHash ?? existing.pin
      const match = hash ? bcrypt.compareSync(pin, hash) : false
      if (!match) {
        if (body?.force) {
          const pinHash = bcrypt.hashSync(pin, 10)
          const acc = { id: nid, pinHash, state: bodyState ?? existing.state ?? null }
          stateDb.upsert("accounts", acc)
          return NextResponse.json({ ok: true, found: false, created: true, replaced: true, state: acc.state })
        }
        return NextResponse.json({ ok: false, error: "invalid_pin" }, { status: 401 })
      }
      return NextResponse.json({ ok: true, found: true, created: false, state: existing.state ?? null })
    }

    if (mode === "login") {
      return NextResponse.json(
        { ok: false, error: "account_not_found", message: "Cuenta no encontrada. Crea una nueva." },
        { status: 404 }
      )
    }

    const pinHash = bcrypt.hashSync(pin, 10)
    const acc = { id: nid, pinHash, state: bodyState ?? null }
    stateDb.upsert("accounts", acc)
    return NextResponse.json({ ok: true, found: false, created: true, state: acc.state })
  } catch (e) {
    console.error("POST /api/accounts/login", e)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}
