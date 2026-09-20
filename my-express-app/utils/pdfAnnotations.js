export const PDF_ANNOTATION_TYPES = new Set([
    "highlight",
    "underline",
    "strikeout",
]);

export const PDF_ANNOTATION_COLORS = new Set([
    "#f7d154",
    "#7bdcb5",
    "#8ed1fc",
    "#cbb7f6",
    "#ff9f9f",
]);

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clampUnit = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return Math.min(1, Math.max(0, number));
};

const normalizeRect = (rect) => {
    if (!rect || typeof rect !== "object") {
        return null;
    }

    const x = clampUnit(rect.x);
    const y = clampUnit(rect.y);
    const width = clampUnit(rect.width);
    const height = clampUnit(rect.height);

    if (
        x === null ||
        y === null ||
        width === null ||
        height === null ||
        width <= 0 ||
        height <= 0
    ) {
        return null;
    }

    return {
        x,
        y,
        width: Math.min(width, 1 - x),
        height: Math.min(height, 1 - y),
    };
};

export const isUuid = (value) => UUID_PATTERN.test(String(value || ""));

export const validateNewPdfAnnotation = (payload = {}) => {
    const noteId = String(payload.note_id || "").trim();
    const pageNumber = Number(payload.page_number);
    const annotationType = String(
        payload.annotation_type || "highlight"
    ).toLowerCase();
    const color = String(payload.color || "#f7d154").toLowerCase();
    const selectedText = String(payload.selected_text || "").trim();
    const comment = String(payload.comment || "").trim();
    const sourceRects = Array.isArray(payload.rects) ? payload.rects : [];
    const rects = sourceRects.map(normalizeRect).filter(Boolean);

    if (!isUuid(noteId)) {
        return { error: "A valid note_id is required." };
    }

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return { error: "page_number must be a positive integer." };
    }

    if (!PDF_ANNOTATION_TYPES.has(annotationType)) {
        return { error: "Unsupported annotation_type." };
    }

    if (!PDF_ANNOTATION_COLORS.has(color)) {
        return { error: "Unsupported annotation color." };
    }

    if (sourceRects.length === 0 || sourceRects.length > 100) {
        return { error: "rects must contain between 1 and 100 rectangles." };
    }

    if (rects.length !== sourceRects.length) {
        return { error: "Every annotation rectangle must be valid." };
    }

    if (!selectedText) {
        return { error: "selected_text is required." };
    }

    if (selectedText.length > 10000) {
        return { error: "selected_text is too long." };
    }

    if (comment.length > 20000) {
        return { error: "comment is too long." };
    }

    return {
        value: {
            noteId,
            pageNumber,
            annotationType,
            color,
            selectedText,
            comment,
            rects,
        },
    };
};

export const validatePdfAnnotationUpdate = (payload = {}) => {
    const hasComment = Object.prototype.hasOwnProperty.call(payload, "comment");
    const hasColor = Object.prototype.hasOwnProperty.call(payload, "color");
    const hasType = Object.prototype.hasOwnProperty.call(
        payload,
        "annotation_type"
    );

    if (!hasComment && !hasColor && !hasType) {
        return { error: "No supported annotation fields were provided." };
    }

    const comment = hasComment ? String(payload.comment || "").trim() : null;
    const color = hasColor
        ? String(payload.color || "").toLowerCase()
        : null;
    const annotationType = hasType
        ? String(payload.annotation_type || "").toLowerCase()
        : null;

    if (comment !== null && comment.length > 20000) {
        return { error: "comment is too long." };
    }

    if (color !== null && !PDF_ANNOTATION_COLORS.has(color)) {
        return { error: "Unsupported annotation color." };
    }

    if (
        annotationType !== null &&
        !PDF_ANNOTATION_TYPES.has(annotationType)
    ) {
        return { error: "Unsupported annotation_type." };
    }

    return {
        value: {
            hasComment,
            comment,
            hasColor,
            color,
            hasType,
            annotationType,
        },
    };
};
