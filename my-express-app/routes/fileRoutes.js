import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import authMiddleware from "../middleware/authMiddleware.js";

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

const getFastApiErrorMessage = (
    error
) => {
    const detail =
        error.response?.data?.detail ??
        error.response?.data?.error ??
        error.message;

    if (typeof detail === "string") {
        return detail;
    }

    try {
        return JSON.stringify(detail);
    } catch {
        return "Unknown ingestion error.";
    }
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
    (req, res) => {
        upload.single("file")(
            req,
            res,
            async (uploadError) => {
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

                const fileUrl =
                    `${req.protocol}://${req.get(
                        "host"
                    )}/uploads/` +
                    encodeURIComponent(
                        req.file.filename
                    );

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
                        const formData =
                            new FormData();

                        formData.append(
                            "user_id",
                            safeUserId
                        );

                        formData.append(
                            "canvas_id",
                            safeCanvasId
                        );

                        formData.append(
                            "file",
                            fs.createReadStream(
                                req.file.path
                            ),
                            {
                                filename:
                                    req.file
                                        .originalname,

                                contentType:
                                    req.file
                                        .mimetype ||
                                    "application/octet-stream",
                            }
                        );

                        /*
                          OCR mode only makes sense
                          for PDF files.
                        */
                        if (
                            sourceType ===
                            "pdf"
                        ) {
                            formData.append(
                                "ocr_mode",
                                "printed"
                            );
                        }

                        const response =
                            await axios.post(
                                `${fastApiBaseUrl}/ingest`,
                                formData,
                                {
                                    headers: {
                                        ...formData.getHeaders(),

                                        ...(process
                                            .env
                                            .FASTAPI_API_KEY
                                            ? {
                                                  "X-API-Key":
                                                      process
                                                          .env
                                                          .FASTAPI_API_KEY,
                                              }
                                            : {}),
                                    },

                                    maxBodyLength:
                                        Infinity,

                                    maxContentLength:
                                        Infinity,
                                }
                            );

                        ingestData =
                            response.data ||
                            {};

                        ingested = true;
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

                        fileSize:
                            req.file.size,

                        mimeType:
                            req.file
                                .mimetype ||
                            "application/octet-stream",

                        extension,
                        sourceType,
                        ingested,
                        warning,
                    });
            }
        );
    }
);

export default router;