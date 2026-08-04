import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      select *
      from canvases
      where user_id = $1
        and is_archived = false
      order by is_pinned desc, last_opened_at desc
      `,
      [req.user.id]
    );

    res.json({ canvases: result.rows });
  } catch (error) {
    console.error("Get canvases error:", error);
    res.status(500).json({ error: "Failed to load canvases." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const title = req.body.title || "Untitled Project";

    const result = await pool.query(
      `
      insert into canvases (user_id, title)
      values ($1, $2)
      returning *
      `,
      [req.user.id, title]
    );

    res.status(201).json({ canvas: result.rows[0] });
  } catch (error) {
    console.error("Create canvas error:", error);
    res.status(500).json({ error: "Failed to create canvas." });
  }
});

router.patch("/:id/open", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      update canvases
      set last_opened_at = now(),
          updated_at = now()
      where id = $1
        and user_id = $2
      returning *
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found." });
    }

    res.json({ canvas: result.rows[0] });
  } catch (error) {
    console.error("Open canvas error:", error);
    res.status(500).json({ error: "Failed to update canvas." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      update canvases
      set is_archived = true,
          updated_at = now()
      where id = $1
        and user_id = $2
      returning *
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found." });
    }

    res.json({
      message: "Canvas archived successfully.",
      canvas: result.rows[0],
    });
  } catch (error) {
    console.error("Delete canvas error:", error);
    res.status(500).json({ error: "Failed to delete canvas." });
  }
});

export default router;