import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const canvasId = String(req.query.canvas_id || "default");
        const result = await pool.query(
            `select
                id,
                canvas_id,
                title,
                body,
                user_note,
                x,
                y,
                source_type,
                source_name,
                file_url,
                file_size,
                chunks_added,
                db_total,
                is_locked,
                is_pinned,
                cluster_id,
                created_at,
                updated_at
             from public.notes
             where user_id = $1
                and canvas_id = $2
             order by created_at asc`,
            [req.user.id, canvasId]
        );

        res.json({
            notes: result.rows,
        });
    } catch (error) {
        console.error("Get notes error:", error);

        res.status(500).json({
            error: "Server error while getting notes.",
        });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    
    const {
        title,
        body,
        user_note,
        x,
        y,
        source_type,
        source_name,
        file_url,
        file_size,
        chunks_added,
        db_total,
        is_locked = false,
        is_pinned = false,
        cluster_id = null,
    } = req.body;

    if (!title) {
        return res.status(400).json({
            error: "Title is required.",
        });
    }
    const canvasId = String(req.body.canvas_id || "default");
    try {
        const result = await pool.query(
            `insert into public.notes (
                user_id,
                canvas_id,
                title,
                body,
                user_note,
                x,
                y,
                source_type,
                source_name,
                file_url,
                file_size,
                chunks_added,
                db_total,
                is_locked,
                is_pinned,
                cluster_id
             )
             values (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16
             )
             returning
                id,
                canvas_id,
                title,
                body,
                user_note,
                x,
                y,
                source_type,
                source_name,
                file_url,
                file_size,
                chunks_added,
                db_total,
                is_locked,
                is_pinned,
                cluster_id,
                created_at,
                updated_at`,
            [
                req.user.id,
                canvasId,
                title,
                body ?? "",
                user_note ?? "",
                x ?? 0,
                y ?? 0,
                source_type || "pdf",
                source_name || title,
                file_url || null,
                file_size ?? null,
                chunks_added ?? null,
                db_total ?? null,
                Boolean(is_locked),
                Boolean(is_pinned),
                cluster_id || null,
            ]
        );

        res.status(201).json({
            message: "Note created successfully.",
            note: result.rows[0],
        });
    } catch (error) {
        console.error("Create note error:", error);

        res.status(500).json({
            error: "Server error while creating note.",
        });
    }
});

router.patch("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    const {
        title,
        body,
        user_note,
        x,
        y,
        is_locked,
        is_pinned,
        cluster_id,
    } = req.body;

    const hasClusterId = Object.prototype.hasOwnProperty.call(
        req.body,
        "cluster_id"
    );

    const normalizedClusterId =
        hasClusterId && cluster_id
            ? String(cluster_id)
            : null;

    try {
        const result = await pool.query(
            `update public.notes
             set
                title = coalesce($1, title),
                body = coalesce($2, body),
                user_note = coalesce($3, user_note),
                x = coalesce($4, x),
                y = coalesce($5, y),
                is_locked = coalesce($6, is_locked),
                is_pinned = coalesce($7, is_pinned),

                cluster_id = case
                    when $8::boolean
                    then $9::text
                    else cluster_id
                end,

                updated_at = now()
             where id = $10 and user_id = $11
             returning
                id,
                canvas_id,
                title,
                body,
                user_note,
                x,
                y,
                source_type,
                source_name,
                file_url,
                file_size,
                chunks_added,
                db_total,
                is_locked,
                is_pinned,
                cluster_id,
                created_at,
                updated_at`,
            [
                title ?? null,
                body ?? null,
                user_note ?? null,
                x ?? null,
                y ?? null,
                is_locked ?? null,
                is_pinned ?? null,
                hasClusterId,
                normalizedClusterId,
                id,
                req.user.id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Note not found.",
            });
        }

        res.json({
            message: "Note updated successfully.",
            note: result.rows[0],
        });
    } catch (error) {
        console.error("Update note error:", error);

        res.status(500).json({
            error: "Server error while updating note.",
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `delete from public.notes
             where id = $1 and user_id = $2
             returning id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Note not found.",
            });
        }

        res.json({
            message: "Note deleted successfully.",
            deletedNoteId: result.rows[0].id,
        });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({
            error: "Server error while deleting note.",
        });
    }
});

export default router;