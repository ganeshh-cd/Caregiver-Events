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

  // A normalized lowercase name used purely for ordering, so records with a
  // real name surface before the messier whitespace-only/blank legacy records.
  const collation = { locale: "en", strength: 2 }

  const [docs, total] = await Promise.all([
    User.aggregate([
      { $match: filter },
      {
        $addFields: {
          _sortName: {
            $toLower: { $trim: { input: { $ifNull: ["$firstName", ""] } } },
          },
        },
      },
      {
        $addFields: {
          // Records with a real name sort first (0), blank ones last (1).
          _hasName: { $cond: [{ $eq: ["$_sortName", ""] }, 1, 0] },
        },
      },
      { $sort: { _hasName: 1, _sortName: 1, _id: 1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ]).collation(collation),
    User.countDocuments(filter),
  ])

  const clean = (v: unknown) => String(v ?? "").trim()

  const participants = docs.map((u: any) => {
    const name =
      [u.firstName, u.middleName, u.lastName].map(clean).filter(Boolean).join(" ") ||
      clean(u.preferredName) ||
      "—"
    return {
      id: String(u._id),
      name,
      email: clean(u.email),
      phone: [clean(u.countryCode), clean(u.phoneNumber)].filter(Boolean).join(" "),
      city: clean(u.city),
    }
  })

  return res.json({ participants, total, page, pageSize })
}
