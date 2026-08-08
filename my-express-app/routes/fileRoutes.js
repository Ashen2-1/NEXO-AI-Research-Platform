import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadFileToSupabaseStorage } from "../utils/supabaseStorage.js";
import {
    checkFileUploadLimit,
    incrementFileUploads,
} from "../utils/usageLimits.js";

const router = express.Router();

const uploadDir = path.resolve(
    process.cwd(),
    "uploads"
);

fs.mkdirSync(uploadDir, {
    recursive: true,
});

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

const SOURCE_TYPE_BY_EXTENSION = {
    ".pdf": "pdf",

    ".doc": "word",
    ".docx": "word",

    ".xls": "excel",
    ".xlsx": "excel",

    ".ppt": "powerpoint",
    ".pptx": "powerpoint",
};

const ALLOWED_EXTENSIONS = new Set(
    Object.keys(
        SOURCE_TYPE_BY_EXTENSION
    )
);

const getFileExtension = (
    fileName = ""
) => {
    return path
        .extname(fileName)
        .toLowerCase();
};

const getSourceType = (
    fileName = ""
) => {
    const extension =
        getFileExtension(fileName);

    return (
        SOURCE_TYPE_BY_EXTENSION[
            extension
        ] || "document"
    );
};

const getFastApiErrorMessage = (error) => {
  const status = error.response?.status;

  const detail =
    error.response?.data?.detail ??
    error.response?.data?.error ??
    error.response?.data ??
    error.message;

  const rawMessage =
    typeof detail === "string"
      ? detail
      : (() => {
          try {
            return JSON.stringify(detail);
          } catch {
            return "Unknown ingestion error.";
          }
        })();

  const looksLikeHtml =
    rawMessage.includes("<!DOCTYPE html") ||
    rawMessage.includes("<html") ||
    rawMessage.includes("<title>502</title>");

  if (looksLikeHtml) {
    return `AI ingestion service is temporarily unavailable${status ? ` (${status})` : ""}. Please check the nexo-rag-api Render logs.`;
  }

  return rawMessage.replace(/\s+/g, " ").slice(0, 500);
};

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const getFastApiBaseUrl = () => {
    const configuredUrl =
        process.env.FASTAPI_BASE_URL?.trim();

    return (
        configuredUrl || "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
};

const warmupFastApi = async () => {
    const fastApiBaseUrl = getFastApiBaseUrl();

    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            console.log(`FastAPI warmup attempt ${attempt}/6`);

            const response = await fetch(`${fastApiBaseUrl}/health`);

            if (response.ok) {
                console.log("FastAPI warmup successful.");
                return true;
            }
        } catch (error) {
            console.log(
                `FastAPI warmup failed attempt ${attempt}:`,
                error.message
            );
        }

        await sleep(10000);
    }

    return false;
};

const isTemporaryFastApiError = (error) => {
    const status = error.response?.status;

    const message = String(
        error.response?.data ||
        error.message ||
        ""
    );

    return (
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes("502") ||
        message.includes("Bad Gateway") ||
        message.includes("Application failed to respond") ||
        message.includes("timeout")
    );
};

const postIngestWithRetry = async ({
    fastApiBaseUrl,
    filePath,
    originalName,
    mimeType,
    sourceType,
    safeUserId,
    safeCanvasId,
}) => {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (attempt === 1) {
                await warmupFastApi();
            }

            if (attempt > 1) {
                console.warn(
                    `Retrying FastAPI ingest attempt ${attempt}/3...`
                );

                await warmupFastApi();
                await sleep(8000);
            }

            const formData = new FormData();

            formData.append("user_id", safeUserId);
            formData.append("canvas_id", safeCanvasId);

            formData.append(
                "file",
                fs.createReadStream(filePath),
                {
                    filename: originalName,
                    contentType:
                        mimeType ||
                        "application/octet-stream",
                }
            );

            if (sourceType === "pdf") {
                formData.append("ocr_mode", "printed");
            }

            return await axios.post(
                `${fastApiBaseUrl}/ingest`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),

                        ...(process.env.FASTAPI_API_KEY
                            ? {
                                  "X-API-Key":
                                      process.env.FASTAPI_API_KEY,
                              }
                            : {}),
                    },

                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    timeout: 900000,
                }
            );
        } catch (error) {
            lastError = error;

            const temporary =
                isTemporaryFastApiError(error);

            console.warn(
                `FastAPI ingest attempt ${attempt}/3 failed:`,
                getFastApiErrorMessage(error)
            );

            if (!temporary || attempt === 3) {
                throw error;
            }
        }
    }

    throw lastError;
};

const storage =
    multer.diskStorage({
        destination: (
            req,
            file,
            callback
        ) => {
            callback(
                null,
                uploadDir
            );
        },

        filename: (
            req,
            file,
            callback
        ) => {
            const originalBaseName =
                path.basename(
                    file.originalname
                );

            const safeOriginalName =
                originalBaseName
                    .normalize("NFKC")
                    .replace(
                        /[<>:"/\\|?*\u0000-\u001F]/g,
                        "_"
                    )
                    .replace(
                        /\s+/g,
                        "_"
                    );

            const uniqueName =
                `${Date.now()}-${safeOriginalName}`;

            callback(
                null,
                uniqueName
            );
        },
    });

const upload = multer({
    storage,

    limits: {
        fileSize: MAX_FILE_SIZE,
    },

    fileFilter: (
        req,
        file,
        callback
    ) => {
        const extension =
            getFileExtension(
                file.originalname
            );

        if (
            !ALLOWED_EXTENSIONS.has(
                extension
            )
        ) {
            const error = new Error(
                "Supported files: PDF, DOC, DOCX, XLS, XLSX, PPT and PPTX."
            );

            error.code =
                "UNSUPPORTED_FILE_TYPE";

            callback(error);
            return;
        }

        callback(null, true);
    },
});

router.post(
    "/ingest",
    authMiddleware,
    async (req, res) => {
        const userId = String(req.user?.id || "").trim();

        try {
            await checkFileUploadLimit(userId);
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                error: error.message || "Usage limit check failed.",
            });
        }

        upload.single("file")(req, res, async (uploadError) => {
                if (uploadError) {
                    if (
                        uploadError instanceof
                            multer.MulterError &&
                        uploadError.code ===
                            "LIMIT_FILE_SIZE"
                    ) {
                        return res
                            .status(413)
                            .json({
                                error:
                                    "File must be under 10MB.",
                            });
                    }

                    return res
                        .status(400)
                        .json({
                            error:
                                uploadError.message ||
                                "File upload failed.",
                        });
                }

                if (!req.file) {
                    return res
                        .status(400)
                        .json({
                            error:
                                "No file uploaded.",
                        });
                }

                const userId = String(req.user.id);
                const canvasId = String(req.body.canvas_id || "default");

                let storageResult = {
                fileUrl: "",
                storagePath: "",
                warning: "",
                };

                try {
                storageResult = await uploadFileToSupabaseStorage({
                    localFilePath: req.file.path,
                    userId,
                    canvasId,
                    originalName: req.file.originalname,
                });
                } catch (storageError) {
                console.error("Storage upload failed:", storageError);

                storageResult.warning =
                    "The file was indexed, but the original preview file could not be saved permanently.";
                }

                const extension =
                    getFileExtension(
                        req.file.originalname
                    );

                const sourceType =
                    getSourceType(
                        req.file.originalname
                    );

                const safeUserId = String(
                        req.user?.id || ""
                    ).trim();

                const safeCanvasId = String(
                    req.body?.canvas_id ||
                    req.body?.canvasId ||
                    "default"
                ).trim() || "default";

                if (!safeUserId) {
                    return res.status(401).json({
                        error: "Authenticated user ID is missing.",
                    });
                }

                const localFileUrl =
                    `${req.protocol}://${req.get(
                        "host"
                    )}/uploads/` +
                    encodeURIComponent(
                        req.file.filename
                    );

                const fileUrl =
                    storageResult.fileUrl ||
                    localFileUrl;

                const fastApiBaseUrl =
                    String(
                        process.env
                            .FASTAPI_BASE_URL ||
                            ""
                    )
                        .trim()
                        .replace(
                            /\/+$/,
                            ""
                        );

                let ingestData = {};
                let ingested = false;
                let warning = "";

                /*
                  Try to send every supported file
                  to the existing FastAPI service.

                  If FastAPI cannot read Word,
                  Excel or PowerPoint, the upload
                  still succeeds and the original
                  file remains available.
                */
                if (fastApiBaseUrl) {
                    try {
                        const response = await postIngestWithRetry({
                            fastApiBaseUrl,
                            filePath: req.file.path,
                            originalName: req.file.originalname,
                            mimeType: req.file.mimetype,
                            sourceType,
                            safeUserId,
                            safeCanvasId,
                        });

                        ingestData = response.data || {};

                        const chunksAdded = Number(
                            ingestData.chunks_added ??
                            ingestData.chunksAdded ??
                            0
                        );

                        ingested = chunksAdded > 0;

                        if (!ingested) {
                            warning =
                                `The ${sourceType} file was uploaded, but no readable chunks were indexed. ` +
                                "Please check whether the PDF text can be extracted.";
                        }
                    } catch (error) {
                        const serviceError =
                            getFastApiErrorMessage(
                                error
                            );

                        console.warn(
                            "File stored without AI ingestion:",
                            serviceError
                        );

                        warning =
                            `The ${sourceType} file was uploaded, ` +
                            "but the AI ingestion service could not index it. " +
                            `Reason: ${serviceError}`;
                    }
                } else {
                    warning =
                        "The file was uploaded, but FASTAPI_BASE_URL is not configured, so it was not indexed by AI.";
                }

                await incrementFileUploads(safeUserId);

                return res
                    .status(201)
                    .json({
                        ...ingestData,

                        userId: safeUserId,
                        canvasId: safeCanvasId,

                        file:
                            ingestData.file ||
                            ingestData.source ||
                            req.file
                                .originalname,

                        originalName:
                            req.file
                                .originalname,

                        storedName:
                            req.file
                                .filename,

                        fileUrl,
                        storagePath: storageResult.storagePath || "",

                        fileSize:
                            req.file.size,

                        mimeType:
                            req.file
                                .mimetype ||
                            "application/octet-stream",

                        extension,
                        sourceType,
                        ingested,
                        warning:
                            [storageResult.warning, warning]
                                .filter(Boolean)
                                .join("\n"),
                    });
            }
        );
    }
);

export default router;