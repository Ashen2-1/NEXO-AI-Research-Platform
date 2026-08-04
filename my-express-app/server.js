import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import pool from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import linkRoutes from "./routes/linkRountes.js";
import aiRoutes from "./routes/aiRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import canvasRoutes from "./routes/canvasRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDirectory = path.join(
    __dirname,
    "uploads"
);

const allowedOrigins = (
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.set("trust proxy", 1);

app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                allowedOrigins.includes(origin)
            ) {
                callback(null, true);
                return;
            }

            const corsError = new Error(
                "Origin is not allowed by CORS."
            );

            corsError.status = 403;
            callback(corsError);
        },

        credentials: true,
    })
);

app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    "/uploads",
    express.static(uploadsDirectory)
);

const healthCheck = async (req, res) => {
    try {
        const result = await pool.query(
            "select now() as current_time"
        );

        res.json({
            status: "ok",
            message:
                "Backend is working and the database is connected.",
            databaseTime:
                result.rows[0].current_time,
        });
    } catch (error) {
        console.error(
            "Database health check error:",
            error.message
        );

        res.status(500).json({
            status: "error",
            error:
                "Backend is running, but the database connection failed.",
        });
    }
};

app.get("/api/health", healthCheck);
app.get("/api/test", healthCheck);

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/canvases", canvasRoutes);
app.use("/api/documents", documentRoutes);


app.use((req, res) => {
    res.status(404).json({
        error: "Route not found.",
    });
});

app.use((error, req, res, next) => {
    console.error(
        "Unhandled server error:",
        error.message
    );

    if (res.headersSent) {
        next(error);
        return;
    }

    res.status(error.status || 500).json({
        error:
            error.status === 403
                ? error.message
                : "Unexpected server error.",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});