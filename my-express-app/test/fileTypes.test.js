import test from "node:test";
import assert from "node:assert/strict";

import {
    ALLOWED_EXTENSIONS,
    getFileExtension,
    getSourceType,
    getStorageMimeType,
} from "../utils/fileTypes.js";

const supportedFiles = [
    ["source.pdf", ".pdf", "pdf", "application/pdf"],
    ["source.doc", ".doc", "word", "application/msword"],
    [
        "source.docx",
        ".docx",
        "word",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ["source.xls", ".xls", "excel", "application/vnd.ms-excel"],
    [
        "source.xlsx",
        ".xlsx",
        "excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    [
        "source.ppt",
        ".ppt",
        "powerpoint",
        "application/vnd.ms-powerpoint",
    ],
    [
        "source.pptx",
        ".pptx",
        "powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
];

test("maps every supported upload extension to its source and MIME types", () => {
    for (const [fileName, extension, sourceType, mimeType] of supportedFiles) {
        assert.equal(getFileExtension(fileName), extension);
        assert.equal(ALLOWED_EXTENSIONS.has(extension), true);
        assert.equal(getSourceType(fileName), sourceType);
        assert.equal(getStorageMimeType(fileName), mimeType);
    }
});

test("normalizes uppercase extensions", () => {
    assert.equal(getFileExtension("SOURCE.DOCX"), ".docx");
    assert.equal(getSourceType("SOURCE.DOCX"), "word");
    assert.equal(
        getStorageMimeType("SOURCE.DOCX"),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
});

test("uses safe fallbacks for unsupported files", () => {
    assert.equal(getSourceType("source.unknown"), "document");
    assert.equal(
        getStorageMimeType("source.unknown"),
        "application/octet-stream"
    );
});
