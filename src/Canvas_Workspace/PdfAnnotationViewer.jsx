import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { apiRequest } from "../api.js";
import "./PdfAnnotationViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

const DEFAULT_COLOR = "#f7d154";
const COLORS = [
    "#f7d154",
    "#7bdcb5",
    "#8ed1fc",
    "#cbb7f6",
    "#ff9f9f",
];
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toRgba = (hex, alpha) => {
    const normalized = String(hex || DEFAULT_COLOR).replace("#", "");

    if (!/^[0-9a-f]{6}$/i.test(normalized)) {
        return `rgba(247, 209, 84, ${alpha})`;
    }

    const value = Number.parseInt(normalized, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const annotationStyle = (annotation, rect) => {
    const color = annotation.color || DEFAULT_COLOR;
    const baseStyle = {
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.width * 100}%`,
        height: `${rect.height * 100}%`,
    };

    if (annotation.annotation_type === "underline") {
        return {
            ...baseStyle,
            backgroundColor: "transparent",
            borderBottomColor: color,
        };
    }

    if (annotation.annotation_type === "strikeout") {
        return {
            ...baseStyle,
            backgroundImage: `linear-gradient(transparent 47%, ${color} 47%, ${color} 57%, transparent 57%)`,
        };
    }

    return {
        ...baseStyle,
        backgroundColor: toRgba(color, 0.42),
    };
};

const createDraftFromAnnotation = (annotation) => ({
    id: annotation.id,
    pageNumber: annotation.page_number,
    annotationType: annotation.annotation_type,
    color: annotation.color,
    selectedText: annotation.selected_text,
    comment: annotation.comment || "",
    rects: annotation.rects || [],
});

function PdfAnnotationViewer({ noteId, fileUrl, title }) {
    const viewportRef = useRef(null);
    const pageFrameRef = useRef(null);
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [basePageWidth, setBasePageWidth] = useState(640);
    const [zoom, setZoom] = useState(1);
    const [annotations, setAnnotations] = useState([]);
    const [draft, setDraft] = useState(null);
    const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [viewerError, setViewerError] = useState("");
    const [annotationError, setAnnotationError] = useState("");

    const canPersistAnnotations = UUID_PATTERN.test(String(noteId || ""));
    const pageWidth = Math.max(280, Math.round(basePageWidth * zoom));

    const pageAnnotations = useMemo(
        () =>
            annotations.filter(
                (annotation) => annotation.page_number === pageNumber
            ),
        [annotations, pageNumber]
    );

    useEffect(() => {
        const viewport = viewportRef.current;

        if (!viewport) {
            return undefined;
        }

        const updateWidth = () => {
            setBasePageWidth(
                Math.max(280, Math.min(840, viewport.clientWidth - 32))
            );
        };

        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(viewport);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let cancelled = false;
        setAnnotations([]);
        setDraft(null);
        setAnnotationError("");

        if (!canPersistAnnotations) {
            return () => {
                cancelled = true;
            };
        }

        setIsLoadingAnnotations(true);

        apiRequest(
            `/pdf-annotations?note_id=${encodeURIComponent(noteId)}`
        )
            .then((data) => {
                if (!cancelled) {
                    setAnnotations(data?.annotations || []);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setAnnotationError(
                        error.message || "Could not load PDF annotations."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingAnnotations(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [canPersistAnnotations, noteId]);

    const clearBrowserSelection = () => {
        const selection = window.getSelection();

        if (selection) {
            selection.removeAllRanges();
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const pageFrame = pageFrameRef.current;

        if (
            !selection ||
            selection.isCollapsed ||
            selection.rangeCount === 0 ||
            !pageFrame
        ) {
            return;
        }

        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);

        if (
            !selectedText ||
            !pageFrame.contains(range.commonAncestorContainer)
        ) {
            return;
        }

        const pageElement = pageFrame.querySelector(".react-pdf__Page");

        if (!pageElement) {
            return;
        }

        const pageRect = pageElement.getBoundingClientRect();
        const rects = Array.from(range.getClientRects())
            .filter(
                (rect) =>
                    rect.width > 1 &&
                    rect.height > 1 &&
                    rect.right > pageRect.left &&
                    rect.left < pageRect.right &&
                    rect.bottom > pageRect.top &&
                    rect.top < pageRect.bottom
            )
            .slice(0, 100)
            .map((rect) => ({
                x: Math.max(0, rect.left - pageRect.left) / pageRect.width,
                y: Math.max(0, rect.top - pageRect.top) / pageRect.height,
                width:
                    Math.min(rect.right, pageRect.right) -
                    Math.max(rect.left, pageRect.left),
                height:
                    Math.min(rect.bottom, pageRect.bottom) -
                    Math.max(rect.top, pageRect.top),
            }))
            .map((rect) => ({
                ...rect,
                width: rect.width / pageRect.width,
                height: rect.height / pageRect.height,
            }));

        if (rects.length === 0) {
            return;
        }

        setDraft({
            id: null,
            pageNumber,
            annotationType: "highlight",
            color: DEFAULT_COLOR,
            selectedText,
            comment: "",
            rects,
        });
        setAnnotationError("");
        clearBrowserSelection();
    };

    const handleSaveAnnotation = async () => {
        if (!draft || !canPersistAnnotations || isSaving) {
            return;
        }

        setIsSaving(true);
        setAnnotationError("");

        try {
            if (draft.id) {
                const data = await apiRequest(
                    `/pdf-annotations/${draft.id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            comment: draft.comment,
                            color: draft.color,
                            annotation_type: draft.annotationType,
                        }),
                    }
                );

                setAnnotations((current) =>
                    current.map((annotation) =>
                        annotation.id === draft.id
                            ? data.annotation
                            : annotation
                    )
                );
            } else {
                const data = await apiRequest("/pdf-annotations", {
                    method: "POST",
                    body: JSON.stringify({
                        note_id: noteId,
                        page_number: draft.pageNumber,
                        annotation_type: draft.annotationType,
                        color: draft.color,
                        selected_text: draft.selectedText,
                        comment: draft.comment,
                        rects: draft.rects,
                    }),
                });

                setAnnotations((current) => [
                    ...current,
                    data.annotation,
                ]);
            }

            setDraft(null);
        } catch (error) {
            setAnnotationError(
                error.message || "Could not save the PDF annotation."
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAnnotation = async () => {
        if (!draft?.id || isSaving) {
            return;
        }

        const shouldDelete = window.confirm(
            "Delete this PDF annotation?"
        );

        if (!shouldDelete) {
            return;
        }

        setIsSaving(true);
        setAnnotationError("");

        try {
            await apiRequest(`/pdf-annotations/${draft.id}`, {
                method: "DELETE",
            });
            setAnnotations((current) =>
                current.filter((annotation) => annotation.id !== draft.id)
            );
            setDraft(null);
        } catch (error) {
            setAnnotationError(
                error.message || "Could not delete the PDF annotation."
            );
        } finally {
            setIsSaving(false);
        }
    };

    const goToPage = (nextPage) => {
        const safePage = Math.min(Math.max(nextPage, 1), numPages || 1);
        setPageNumber(safePage);
        setDraft(null);
        clearBrowserSelection();
    };

    const visibleAnnotations = [
        ...pageAnnotations,
        ...(draft && !draft.id && draft.pageNumber === pageNumber
            ? [
                  {
                      id: "pending",
                      page_number: draft.pageNumber,
                      annotation_type: draft.annotationType,
                      color: draft.color,
                      selected_text: draft.selectedText,
                      comment: draft.comment,
                      rects: draft.rects,
                  },
              ]
            : []),
    ];

    return (
        <div
            className="Pdf_Annotation_Viewer"
            aria-label={`PDF annotation viewer for ${title || "document"}`}
        >
            <div className="Pdf_Annotation_Toolbar">
                <div className="Pdf_Annotation_PageControls">
                    <button
                        type="button"
                        onClick={() => goToPage(pageNumber - 1)}
                        disabled={pageNumber <= 1}
                        aria-label="Previous PDF page"
                    >
                        ‹
                    </button>
                    <span>
                        Page {pageNumber} / {numPages || "-"}
                    </span>
                    <button
                        type="button"
                        onClick={() => goToPage(pageNumber + 1)}
                        disabled={!numPages || pageNumber >= numPages}
                        aria-label="Next PDF page"
                    >
                        ›
                    </button>
                </div>

                <div className="Pdf_Annotation_ZoomControls">
                    <button
                        type="button"
                        onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
                        aria-label="Zoom out"
                    >
                        −
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}
                        aria-label="Zoom in"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="Pdf_Annotation_Hint">
                Select text on the page to create a highlight and note.
                {isLoadingAnnotations && " Loading annotations..."}
            </div>

            {!canPersistAnnotations && (
                <div className="Pdf_Annotation_Message Pdf_Annotation_Message_Warning">
                    Finish uploading this PDF before adding annotations.
                </div>
            )}

            {(viewerError || annotationError) && (
                <div className="Pdf_Annotation_Message Pdf_Annotation_Message_Error">
                    {viewerError || annotationError}
                </div>
            )}

            {draft && (
                <div className="Pdf_Annotation_Editor">
                    <div className="Pdf_Annotation_Editor_Header">
                        <strong>
                            {draft.id ? "Edit annotation" : "New annotation"}
                        </strong>
                        <button
                            type="button"
                            onClick={() => setDraft(null)}
                            aria-label="Close annotation editor"
                        >
                            ×
                        </button>
                    </div>

                    <blockquote title={draft.selectedText}>
                        {draft.selectedText}
                    </blockquote>

                    <div className="Pdf_Annotation_Editor_Options">
                        <label>
                            Style
                            <select
                                value={draft.annotationType}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        annotationType: event.target.value,
                                    }))
                                }
                            >
                                <option value="highlight">Highlight</option>
                                <option value="underline">Underline</option>
                                <option value="strikeout">Strikeout</option>
                            </select>
                        </label>

                        <div className="Pdf_Annotation_Colors" aria-label="Annotation color">
                            {COLORS.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    className={draft.color === color ? "is-active" : ""}
                                    style={{ backgroundColor: color }}
                                    onClick={() =>
                                        setDraft((current) => ({
                                            ...current,
                                            color,
                                        }))
                                    }
                                    aria-label={`Use annotation color ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={draft.comment}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                comment: event.target.value,
                            }))
                        }
                        placeholder="Add a note about this passage..."
                        maxLength={20000}
                    />

                    <div className="Pdf_Annotation_Editor_Actions">
                        {draft.id && (
                            <button
                                type="button"
                                className="Pdf_Annotation_Delete"
                                onClick={handleDeleteAnnotation}
                                disabled={isSaving}
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setDraft(null)}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="Pdf_Annotation_Save"
                            onClick={handleSaveAnnotation}
                            disabled={isSaving || !canPersistAnnotations}
                        >
                            {isSaving ? "Saving..." : "Save annotation"}
                        </button>
                    </div>
                </div>
            )}

            <div className="Pdf_Annotation_Viewport" ref={viewportRef}>
                <div
                    className="Pdf_Annotation_PageFrame"
                    ref={pageFrameRef}
                    onMouseUp={handleTextSelection}
                >
                    <Document
                        file={fileUrl}
                        onLoadSuccess={({ numPages: loadedPages }) => {
                            setNumPages(loadedPages);
                            setPageNumber((current) =>
                                Math.min(current, loadedPages)
                            );
                            setViewerError("");
                        }}
                        onLoadError={(error) =>
                            setViewerError(
                                error.message || "Could not load this PDF."
                            )
                        }
                        loading={<div className="Pdf_Annotation_Loading">Loading PDF...</div>}
                        error={null}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={pageWidth}
                            renderTextLayer
                            renderAnnotationLayer
                            loading={<div className="Pdf_Annotation_Loading">Rendering page...</div>}
                        />
                    </Document>

                    <div className="Pdf_Annotation_Overlay" aria-label="Saved PDF annotations">
                        {visibleAnnotations.flatMap((annotation) =>
                            (annotation.rects || []).map((rect, index) => (
                                <button
                                    type="button"
                                    key={`${annotation.id}-${index}`}
                                    className={`Pdf_Annotation_Mark Pdf_Annotation_Mark_${annotation.annotation_type} ${annotation.id === "pending" ? "is-pending" : ""}`}
                                    style={annotationStyle(annotation, rect)}
                                    onMouseUp={(event) => event.stopPropagation()}
                                    onClick={() => {
                                        if (annotation.id !== "pending") {
                                            setDraft(
                                                createDraftFromAnnotation(annotation)
                                            );
                                            setAnnotationError("");
                                        }
                                    }}
                                    aria-label={`Edit annotation: ${annotation.selected_text}`}
                                    title={annotation.comment || annotation.selected_text}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="Pdf_Annotation_StatusBar">
                <span>
                    {pageAnnotations.length} annotation
                    {pageAnnotations.length === 1 ? "" : "s"} on this page
                </span>
                <a href={fileUrl} target="_blank" rel="noreferrer">
                    Open original PDF
                </a>
            </div>
        </div>
    );
}

export default PdfAnnotationViewer;
