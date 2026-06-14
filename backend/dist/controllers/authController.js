import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLE, USER_STATUS, User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const registerSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});
function normalizeStoredPassword(password) {
    // Admins created here store a bcrypt hash string. Guard against the
    // array/empty shapes seen in imported participant records.
    if (Array.isArray(password))
        return typeof password[0] === "string" ? password[0] : "";
    return typeof password === "string" ? password : "";
}
function publicUser(user) {
    return {
        id: String(user._id),
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email,
        roleId: user.roleId,
        status: user.status,
    };
}
export async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email or password format" });
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    // Only admins (roleId = 1) are allowed to log in.
    if (user.roleId !== ROLE.ADMIN) {
        return res.status(403).json({ message: "Only administrators can sign in" });
    }
    const hash = normalizeStoredPassword(user.password);
    const ok = hash ? await bcrypt.compare(password, hash) : false;
    if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signToken({ sub: String(user._id), email: user.email, roleId: user.roleId });
    return res.json({ token, user: publicUser(user) });
}
export async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors });
    }
    const { firstName, lastName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    // Registration creates Admin users only (roleId = 1).
    const user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password: hash,
        roleId: ROLE.ADMIN,
        status: USER_STATUS.ACTIVE,
    });
    const token = signToken({ sub: String(user._id), email: user.email, roleId: user.roleId });
    return res.status(201).json({ token, user: publicUser(user) });
}
export async function me(req, res) {
    const user = await User.findById(req.user?.sub);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: publicUser(user) });
}
