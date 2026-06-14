import { verifyToken } from "../utils/jwt.js";
import { ROLE } from "../models/User.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }
    const token = header.slice("Bearer ".length);
    try {
        req.user = verifyToken(token);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function requireAdmin(req, res, next) {
    if (req.user?.roleId !== ROLE.ADMIN) {
        return res.status(403).json({ message: "Admin access required" });
    }
    return next();
}
