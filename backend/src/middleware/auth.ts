import type { NextFunction, Request, Response } from "express"
import { verifyToken, type JwtPayload } from "../utils/jwt.js"
import { ROLE } from "../models/User.js"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" })
  }
  const token = header.slice("Bearer ".length)
  try {
    req.user = verifyToken(token)
    return next()
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.roleId !== ROLE.ADMIN) {
    return res.status(403).json({ message: "Admin access required" })
  }
  return next()
}
