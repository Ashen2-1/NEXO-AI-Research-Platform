import test from "node:test";
import assert from "node:assert/strict";
import {
    validateNewPdfAnnotation,
    validatePdfAnnotationUpdate,
} from "../utils/pdfAnnotations.js";

const validPayload = {
    note_id: "5f7394f0-4bf2-4f44-b5f0-9d39dc05000b",
    page_number: 2,
    annotation_type: "highlight",
    color: "#f7d154",
    selected_text: "A grounded selection",
    comment: "Useful evidence",
    rects: [
        {
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.04,
        },
    ],
};

test("accepts and normalizes a valid PDF annotation", () => {
    const result = validateNewPdfAnnotation(validPayload);

    assert.equal(result.error, undefined);
    assert.deepEqual(result.value.rects, validPayload.rects);
    assert.equal(result.value.comment, "Useful evidence");
});

test("rejects invalid or empty highlight geometry", () => {
    const invalid = validateNewPdfAnnotation({
        ...validPayload,
        rects: [{ x: 0.1, y: 0.2, width: 0, height: 0.04 }],
    });
    const empty = validateNewPdfAnnotation({
        ...validPayload,
        rects: [],
    });

    assert.equal(invalid.error, "Every annotation rectangle must be valid.");
    assert.equal(
        empty.error,
        "rects must contain between 1 and 100 rectangles."
    );
});

test("rejects unsupported annotation styles", () => {
    const typeResult = validateNewPdfAnnotation({
        ...validPayload,
        annotation_type: "freehand",
    });
    const colorResult = validateNewPdfAnnotation({
        ...validPayload,
        color: "#000000",
    });

    assert.equal(typeResult.error, "Unsupported annotation_type.");
    assert.equal(colorResult.error, "Unsupported annotation color.");
});

test("allows clearing a comment while updating an annotation", () => {
    const result = validatePdfAnnotationUpdate({
        comment: "",
        color: "#8ed1fc",
        annotation_type: "underline",
    });

    assert.equal(result.error, undefined);
    assert.equal(result.value.hasComment, true);
    assert.equal(result.value.comment, "");
    assert.equal(result.value.color, "#8ed1fc");
    assert.equal(result.value.annotationType, "underline");
});
