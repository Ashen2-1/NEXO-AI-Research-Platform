import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";

const router = express.Router();
const googleClient = new OAuth2Client();

const createSessionToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

router.post("/register", async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and Password are required."
        });
    }
    if (password.length < 8) {
        return res.status(400).json({
            error: "Password must contain at least 8 characters.",
        });
    }

    try {
        const existingUser = await pool.query(
            "select id from public.app_users where email = $1",
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: "Email already registered.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10); /** For now I put it as do 10 times. */

        const result = await pool.query(
            `insert into public.app_users (email, password_hash) values ($1, $2) returning id, email, created_at`, [email.toLowerCase(), passwordHash]
        );

        const user = result.rows[0];

        const token = createSessionToken(user);

        res.status(201).json({
            message: "User registered successfully.",
            token,
            user,
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            error: "Server error during registration."
        });
    }
});

router.post("/login", async (req,res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required."
        });
    }

    try {
        const result = await pool.query(
            `select id, email, password_hash, created_at from public.app_users where email = $1`, [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password.",
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        const token = createSessionToken(user);

        res.json({
            message: "Login Successful.",
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        });
    }catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Sever error during login."
        });
    }
});

router.post("/google", async (req, res) => {
    const credential = String(req.body?.credential || "").trim();
    const googleClientId = String(
        process.env.GOOGLE_CLIENT_ID || ""
    ).trim();

    if (!googleClientId) {
        return res.status(503).json({
            error: "Google sign-in is not configured on the server.",
        });
    }

    if (!credential) {
        return res.status(400).json({
            error: "Google credential is required.",
        });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();
        const email = String(payload?.email || "")
            .trim()
            .toLowerCase();

        if (!email || payload?.email_verified !== true) {
            return res.status(401).json({
                error: "Google did not return a verified email address.",
            });
        }

        let result = await pool.query(
            `select id, email, created_at
             from public.app_users
             where email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            const unusablePassword = crypto.randomBytes(48).toString("hex");
            const passwordHash = await bcrypt.hash(unusablePassword, 10);

            result = await pool.query(
                `insert into public.app_users (email, password_hash)
                 values ($1, $2)
                 on conflict (email) do update set email = excluded.email
                 returning id, email, created_at`,
                [email, passwordHash]
            );
        }

        const user = result.rows[0];
        const token = createSessionToken(user);

        return res.json({
            message: "Google sign-in successful.",
            token,
            user,
        });
    } catch (error) {
        console.warn("Google authentication failed:", error.message);

        return res.status(401).json({
            error: "Google sign-in could not be verified.",
        });
    }
});

export default router;
