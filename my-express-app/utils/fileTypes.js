import path from "path";

export const FILE_TYPE_BY_EXTENSION = Object.freeze({
    ".pdf": Object.freeze({
        sourceType: "pdf",
        mimeType: "application/pdf",
    }),
    ".doc": Object.freeze({
        sourceType: "word",
        mimeType: "application/msword",
    }),
    ".docx": Object.freeze({
        sourceType: "word",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    ".xls": Object.freeze({
        sourceType: "excel",
        mimeType: "application/vnd.ms-excel",
    }),
    ".xlsx": Object.freeze({
        sourceType: "excel",
        mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    ".ppt": Object.freeze({
        sourceType: "powerpoint",
        mimeType: "application/vnd.ms-powerpoint",
    }),
    ".pptx": Object.freeze({
        sourceType: "powerpoint",
        mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
});

export const ALLOWED_EXTENSIONS = new Set(
    Object.keys(FILE_TYPE_BY_EXTENSION)
);

export const getFileExtension = (fileName = "") =>
    path.extname(String(fileName)).toLowerCase();

export const getSourceType = (fileName = "") => {
    const extension = getFileExtension(fileName);

    return FILE_TYPE_BY_EXTENSION[extension]?.sourceType || "document";
};

export const getStorageMimeType = (fileName = "") => {
    const extension = getFileExtension(fileName);

    return (
        FILE_TYPE_BY_EXTENSION[extension]?.mimeType ||
        "application/octet-stream"
    );
};
