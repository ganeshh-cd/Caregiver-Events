import type { Request, Response } from "express"
import { ROLE, USER_STATUS, User } from "../models/User.js"

/**
 * Search active participants (roleId = 4, status = ACTIVE).
 * Supports text search across name/email/phone/city and pagination.
 */
export async function searchParticipants(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim()
  const page = Math.max(1, Number(req.query.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 10)))

  const filter: Record<string, unknown> = {
    roleId: ROLE.PARTICIPANT,
    status: USER_STATUS.ACTIVE,
  }

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    filter.$or = [
      { firstName: regex },
      { middleName: regex },
      { lastName: regex },
      { preferredName: regex },
      { email: regex },
      { phoneNumber: regex },
      { city: regex },
    ]
  }

  const [docs, total] = await Promise.all([
    User.find(filter)
      .select("firstName middleName lastName preferredName email countryCode phoneNumber city state")
      .sort({ firstName: 1, lastName: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ])

  const participants = docs.map((u: any) => ({
    id: String(u._id),
    name: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ").trim() || u.preferredName || "—",
    email: u.email ?? "",
    phone: [u.countryCode, u.phoneNumber].filter(Boolean).join(" ").trim(),
    city: u.city ?? "",
  }))

  return res.json({ participants, total, page, pageSize })
}
