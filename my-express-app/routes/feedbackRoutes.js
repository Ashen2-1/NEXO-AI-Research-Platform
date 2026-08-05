import express from "express";

import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    async (req, res) => {
        const feedbackContent = String(
            req.body?.feedback_content || ""
        ).trim();

        const userEmail = String(
            req.user?.email || ""
        )
            .trim()
            .toLowerCase();

        if (!feedbackContent) {
            return res.status(400).json({
                error: "Feedback cannot be empty.",
            });
        }

        if (feedbackContent.length > 5000) {
            return res.status(400).json({
                error:
                    "Feedback must be 5000 characters or fewer.",
            });
        }

        if (!userEmail) {
            return res.status(400).json({
                error:
                    "Could not identify the current user.",
            });
        }

        try {
            const result = await pool.query(
                `
                insert into public.user_feedback (
                    user_email,
                    feedback_content
                )
                values ($1, $2)
                returning
                    id,
                    user_email,
                    feedback_content,
                    created_at
                `,
                [
                    userEmail,
                    feedbackContent,
                ]
            );

            return res.status(201).json({
                success: true,
                feedback: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Save feedback error:",
                error
            );

            return res.status(500).json({
                error:
                    "Failed to save feedback.",
            });
        }
    }
);

export default router;