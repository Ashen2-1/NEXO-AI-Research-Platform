import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    isUuid,
    validateNewPdfAnnotation,
    validatePdfAnnotationUpdate,
} from "../utils/pdfAnnotations.js";

const router = express.Router();

const annotationColumns = `
    id,
    note_id,
    page_number,
    annotation_type,
    color,
    selected_text,
    comment,
    rects,
    created_at,
    updated_at
`;

router.get("/", authMiddleware, async (req, res) => {
    const noteId = String(req.query.note_id || "").trim();

    if (!isUuid(noteId)) {
        return res.status(400).json({
            error: "A valid note_id is required.",
        });
    }

    try {
        const noteResult = await pool.query(
            `select id
             from public.notes
             where id = $1 and user_id = $2`,
            [noteId, req.user.id]
        );

        if (noteResult.rows.length === 0) {
            return res.status(404).json({
                error: "PDF note not found.",
            });
        }

        const result = await pool.query(
            `select ${annotationColumns}
             from public.pdf_annotations
             where note_id = $1 and user_id = $2
             order by page_number asc, created_at asc`,
            [noteId, req.user.id]
        );

        return res.json({
            annotations: result.rows,
        });
    } catch (error) {
        console.error("Get PDF annotations error:", error);
        return res.status(500).json({
            error: "Server error while getting PDF annotations.",
        });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    const validation = validateNewPdfAnnotation(req.body);

    if (validation.error) {
        return res.status(400).json({
            error: validation.error,
        });
    }

    const annotation = validation.value;

    try {
        const result = await pool.query(
            `insert into public.pdf_annotations (
                user_id,
                note_id,
                page_number,
                annotation_type,
                color,
                selected_text,
                comment,
                rects
             )
             select
                $1,
                notes.id,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8::jsonb
             from public.notes
             where notes.id = $2 and notes.user_id = $1
             returning ${annotationColumns}`,
            [
                req.user.id,
                annotation.noteId,
                annotation.pageNumber,
                annotation.annotationType,
                annotation.color,
                annotation.selectedText,
                annotation.comment,
                JSON.stringify(annotation.rects),
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "PDF note not found.",
            });
        }

        return res.status(201).json({
            message: "PDF annotation created successfully.",
            annotation: result.rows[0],
        });
    } catch (error) {
        console.error("Create PDF annotation error:", error);
        return res.status(500).json({
            error: "Server error while creating the PDF annotation.",
        });
    }
});

router.patch("/:id", authMiddleware, async (req, res) => {
    const annotationId = String(req.params.id || "").trim();

    if (!isUuid(annotationId)) {
        return res.status(400).json({
            error: "A valid annotation id is required.",
        });
    }

    const validation = validatePdfAnnotationUpdate(req.body);

    if (validation.error) {
        return res.status(400).json({
            error: validation.error,
        });
    }

    const update = validation.value;

    try {
        const result = await pool.query(
            `update public.pdf_annotations
             set
                comment = case when $1::boolean then $2 else comment end,
                color = case when $3::boolean then $4 else color end,
                annotation_type = case
                    when $5::boolean then $6
                    else annotation_type
                end,
                updated_at = now()
             where id = $7 and user_id = $8
             returning ${annotationColumns}`,
            [
                update.hasComment,
                update.comment,
                update.hasColor,
                update.color,
                update.hasType,
                update.annotationType,
                annotationId,
                req.user.id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "PDF annotation not found.",
            });
        }

        return res.json({
            message: "PDF annotation updated successfully.",
            annotation: result.rows[0],
        });
    } catch (error) {
        console.error("Update PDF annotation error:", error);
        return res.status(500).json({
            error: "Server error while updating the PDF annotation.",
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const annotationId = String(req.params.id || "").trim();

    if (!isUuid(annotationId)) {
        return res.status(400).json({
            error: "A valid annotation id is required.",
        });
    }

    try {
        const result = await pool.query(
            `delete from public.pdf_annotations
             where id = $1 and user_id = $2
             returning id`,
            [annotationId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "PDF annotation not found.",
            });
        }

        return res.json({
            message: "PDF annotation deleted successfully.",
            deletedAnnotationId: result.rows[0].id,
        });
    } catch (error) {
        console.error("Delete PDF annotation error:", error);
        return res.status(500).json({
            error: "Server error while deleting the PDF annotation.",
        });
    }
});

export default router;
