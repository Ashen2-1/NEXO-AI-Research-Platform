import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const canvasId = String(req.query.canvas_id || "default");

        const result = await pool.query(
            `
            select
                l.id,
                l.from_note_id,
                l.to_note_id,
                l.created_at
            from public.note_links l
            join public.notes n1
                on n1.id = l.from_note_id
            join public.notes n2
                on n2.id = l.to_note_id
            where l.user_id = $1
              and n1.user_id = $1
              and n2.user_id = $1
              and n1.canvas_id = $2
              and n2.canvas_id = $2
            order by l.created_at asc
            `,
            [req.user.id, canvasId]
        );

        res.json({
            links: result.rows,
        });
    } catch (error) {
        console.error("Get link error:", error);
        res.status(500).json({
            error: "Server error while getting links.",
        });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    const { from_note_id, to_note_id } = req.body;

    if (!from_note_id || !to_note_id) {
        return res.status(400).json({
            error: "from_note_id and to_note_id are required.",
        });
    }

    try {
        const noteCheck = await pool.query(
            `
            select count(*)::int as count
            from public.notes
            where user_id = $1
              and id = any($2::uuid[])
            `,
            [req.user.id, [from_note_id, to_note_id]]
        );

        if (noteCheck.rows[0].count !== 2) {
            return res.status(400).json({
                error: "Both notes must belong to the current user.",
            });
        }

        const result = await pool.query(
            `insert into public.note_links (user_id, from_note_id, to_note_id)
             values ($1, $2, $3)
             on conflict (user_id, from_note_id, to_note_id) do nothing
             returning id, from_note_id, to_note_id, created_at`,
            [req.user.id, from_note_id, to_note_id]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                error: "Link already exists.",
            });
        }

        res.status(201).json({
            message: "Link created successfully.",
            link: result.rows[0],
        });
    } catch (error) {
        console.error("Create link error:", error);
        res.status(500).json({
            error: "Server error while creating link.",
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `delete from public.note_links
             where id = $1 and user_id = $2
             returning id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Link not found.",
            });
        }

        res.json({
            message: "Link deleted successfully.",
            deletedLinkId: result.rows[0].id,
        });
    } catch (error) {
        console.error("Delete link error:", error);
        res.status(500).json({
            error: "Server error while deleting link.",
        });
    }
});

export default router;