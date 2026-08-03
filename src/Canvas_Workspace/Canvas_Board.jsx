import React, { useEffect, useRef, useState } from "react";
import Header from "./Header.jsx";
import UploadFile from "../Upload_Section/uploadFile.jsx";
import DatabaseSearch from "../Upload_Section/databaseSearch.jsx";
import "./Canvas_Board.css"
import FrameworkPanel from "./FrameworkPanel.jsx";
//import { supabase } from "../lib/supabase";
import { apiRequest } from "../api.js";
import ReactMarkdown from "react-markdown";

import { TfiAlignJustify } from "react-icons/tfi";
import { VscArrowUp } from "react-icons/vsc";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { AiOutlineDoubleLeft } from "react-icons/ai";
import { FaHome } from "react-icons/fa";
import { FaLink } from "react-icons/fa6";
import { TiArrowBack } from "react-icons/ti";
import { TiArrowForward } from "react-icons/ti";
import { IoLinkSharp } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { FaListUl } from "react-icons/fa";
import { FaListOl } from "react-icons/fa";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";


const FRAMEWORK_STORAGE_SOURCE = "__nexo_framework__";
const OUTLINE_STORAGE_SOURCE = "__nexo_outline__";
const HISTORY_LIMIT = 50;

const getUploadedSourceType = (
    fileName = "",
    backendSourceType = ""
) => {
    const aliases = {
        pdf: "pdf",

        word: "word",
        doc: "word",
        docx: "word",

        excel: "excel",
        xls: "excel",
        xlsx: "excel",

        powerpoint:
            "powerpoint",
        ppt: "powerpoint",
        pptx: "powerpoint",
    };

    const normalizedBackendType =
        String(
            backendSourceType || ""
        )
            .trim()
            .toLowerCase();

    if (
        aliases[
            normalizedBackendType
        ]
    ) {
        return aliases[
            normalizedBackendType
        ];
    }

    const extension =
        String(fileName)
            .split(".")
            .pop()
            ?.toLowerCase() || "";

    return (
        aliases[extension] ||
        "document"
    );
};


const getCanvasNoteTypeLabel = (
    noteKind
) => {
    const labels = {
        outline:
            "Generated Outline",

        framework:
            "Framework",

        pdf:
            "PDF Source",

        word:
            "Word Source",

        excel:
            "Excel Source",

        powerpoint:
            "PowerPoint Source",

        document:
            "Document Source",
        openalex:
            "OpenAlex Source",
    };

    return (
        labels[noteKind] ||
        "Note"
    );
};

function CanvasBoard(){

    const currentUser = JSON.parse(localStorage.getItem("nexo_user") || "null");

    const handleLogout = () => {
        localStorage.removeItem("nexo_token");
        localStorage.removeItem("nexo_user");
        window.location.href = "/login";
    };

    const [files, setFiles] = useState([
        // {
        //     id: 1,
        //     title: "The Document Name",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 2,
        //     title: "The Document Name2",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 3,
        //     title: "The Document Name3",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 4,
        //     title: "The Document Name4",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 5,
        //     title: "The Document Name5",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 6,
        //     title: "The Document Name6",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 7,
        //     title: "The Document Name7",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // },
        // {
        //     id: 8,
        //     title: "The Document Name8",
        //     date: "2026.05.04",
        //     size: "1KTB",
        // }
    ]);

    const [notes, setNotes] = useState([]);
    const [links, setLinks] = useState([]);

    const [sourceSearchQuery, setSourceSearchQuery] = useState("");

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDatabaseSearch, setShowDatabaseSearch] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isCabinetOpen, setIsCabinetOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [draggingNoteId, setDraggingNoteId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hasDraggedNote, setHasDraggedNote] = useState(false);
    const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
    const [isPanningBoard, setIsPanningBoard] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0});
    const [boardScale, setBoardScale] = useState(1);
    const [hoveredNoteId, setHoveredNoteId] = useState(null);
    const [openedNoteId, setOpenedNoteId] = useState(null);
    const [noteDraft, setNoteDraft] = useState("");
    const editorRef = useRef(null);
    const chatBottomRef = useRef(null);
    const expandedFrameworkEditorRef = useRef(null);
    const [activeCitationSource, setActiveCitationSource] = useState(null);

    const [activeToolMode, setActiveToolMode] = useState("canvas");

    const [isFrameworkPanelOpen, setIsFrameworkPanelOpen] = useState(false);
    const [frameworkStep, setFrameworkStep] = useState("setup"); 
    // "setup" | "generating" | "output"

    const [frameworkDirection, setFrameworkDirection] = useState("");
    const [frameworkArgument, setFrameworkArgument] = useState("");

    const [frameworkDetailLevel, setFrameworkDetailLevel] = useState("detailed");

    const [frameworkOptions, setFrameworkOptions] = useState({
        theoryConcepts: true,
        claimsEvidence: true,
        caseStudies: false,
        researchGaps: true,
        originalContribution: true,
        linkClaimsToSources: true,
    });

    const [currentFramework, setCurrentFramework] = useState(null);
    const [frameworkVersions, setFrameworkVersions] = useState([]);
    const [isFrameworkExpanded, setIsFrameworkExpanded] = useState(false);
    const [frameworkEditorDraft, setFrameworkEditorDraft] = useState("");
    const [frameworkSaveStatus, setFrameworkSaveStatus] = useState("saved");
    const [frameworkGenerationError, setFrameworkGenerationError] = useState("");
    const [frameworkRefinementPrompt, setFrameworkRefinementPrompt] = useState("");
    const [isFrameworkRefining, setIsFrameworkRefining] = useState(false);
    const [isConvertingOutline, setIsConvertingOutline] = useState(false);

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [isRestoringHistory, setIsRestoringHistory] = useState(false);

    /*
     * React state is used to render the Undo/Redo buttons.
     * Refs are the synchronous source of truth used by event handlers,
     * so rapid clicks cannot read an out-of-date stack.
     */
    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const historyBusyRef = useRef(false);

    const dragStartSnapshot = useRef(null);
    const dragSaveInProgressRef = useRef(false);

    const panStartSnapshotRef = useRef(null);
    const panHasMovedRef = useRef(false);

    const zoomHistoryActiveRef = useRef(false);
    const zoomHistoryTimerRef = useRef(null);

    const clusterDragRef = useRef({
        noteIds: [],
        startWorldX: 0,
        startWorldY: 0,
        startPositions: {},
        lastDeltaX: 0,
        lastDeltaY: 0,
        hasMoved: false,
    });

    const frameworkLastSavedContentRef = useRef("");
    const frameworkLatestDraftRef = useRef("");
    const frameworkGenerationAbortRef = useRef(null);

    const NOTE_WIDTH = 185; /** Currently I set the width of the note to be 185px */
    const NOTE_HEIGHT = 160; /** Currently I set the Height of the note to be 160px */
    /***************************************************************************/
    /** This function loads all saved canvas notes from Supabase when the board opens */
    // const fetchCanvasNotes = async () => {
    //     const { data, error } = await supabase
    //         .from("canvas_notes")
    //         .select("*")
    //         .order("created_at", { ascending: true });

    //     if (error) {
    //         console.error("Failed to fetch canvas notes:", error);
    //         return;
    //     }

    //     const formattedNotes = data.map((note) => ({
    //         id: note.id,
    //         documentId: note.document_id,
    //         title: note.title,
    //         body: note.body,
    //         x: note.x_position,
    //         y: note.y_position,
    //         selected: note.selected,
    //     }));

    //     setNotes(formattedNotes);
    // };
    const getSnapshot = () => ({
        notes: notes.map((note) => ({
            ...note,
        })),
        links: links.map((link) => ({
            ...link,
        })),
        boardOffset: { ...boardOffset },
        boardScale,
    });

    const isValidSnapshot = (snapshot) =>
        Boolean(
            snapshot &&
                typeof snapshot === "object" &&
                Array.isArray(snapshot.notes) &&
                Array.isArray(snapshot.links) &&
                snapshot.notes.every(
                    (note) =>
                        note &&
                        typeof note === "object" &&
                        note.id !== undefined &&
                        note.id !== null
                ) &&
                snapshot.links.every(
                    (link) =>
                        link &&
                        typeof link === "object"
                )
        );

    const cloneSnapshot = (snapshot) => {
        if (!isValidSnapshot(snapshot)) {
            return null;
        }

        const snapshotScale = Number(
            snapshot.boardScale
        );

        return {
            notes: snapshot.notes.map((note) => ({
                ...note,
            })),
            links: snapshot.links.map((link) => ({
                ...link,
            })),
            boardOffset: {
                x:
                    Number(
                        snapshot.boardOffset?.x
                    ) || 0,
                y:
                    Number(
                        snapshot.boardOffset?.y
                    ) || 0,
            },
            boardScale:
                Number.isFinite(snapshotScale) &&
                snapshotScale > 0
                    ? snapshotScale
                    : 1,
        };
    };

    const sanitizeHistoryStack = (
        stack,
        stackName
    ) => {
        const sourceStack = Array.isArray(stack)
            ? stack
            : [];

        const validEntries = sourceStack
            .filter(isValidSnapshot)
            .slice(-HISTORY_LIMIT);

        if (
            validEntries.length !==
            sourceStack.length
        ) {
            console.warn(
                `[History] Removed ${
                    sourceStack.length -
                    validEntries.length
                } invalid or expired ${stackName} record(s).`
            );
        }

        return validEntries;
    };

    const replaceUndoStack = (nextStack) => {
        const sanitized = sanitizeHistoryStack(
            nextStack,
            "Undo"
        );

        undoStackRef.current = sanitized;
        setUndoStack(sanitized);
    };

    const replaceRedoStack = (nextStack) => {
        const sanitized = sanitizeHistoryStack(
            nextStack,
            "Redo"
        );

        redoStackRef.current = sanitized;
        setRedoStack(sanitized);
    };

    const endZoomHistoryGesture = () => {
        zoomHistoryActiveRef.current = false;

        if (zoomHistoryTimerRef.current) {
            window.clearTimeout(
                zoomHistoryTimerRef.current
            );
            zoomHistoryTimerRef.current = null;
        }
    };

    const pushUndoSnapshot = (
        snapshot,
        {
            clearRedo = true,
            source = "action",
        } = {}
    ) => {
        const safeSnapshot =
            cloneSnapshot(snapshot);

        if (!safeSnapshot) {
            console.warn(
                "[History] Refused to add an invalid Undo snapshot.",
                snapshot
            );
            return false;
        }

        if (source !== "zoom") {
            endZoomHistoryGesture();
        }

        replaceUndoStack([
            ...undoStackRef.current,
            safeSnapshot,
        ]);

        if (clearRedo) {
            replaceRedoStack([]);
        }

        return true;
    };

    const restoreSnapshot = async (snapshot) => {
        if (!isValidSnapshot(snapshot)) {
            console.warn(
                "[History] Ignored an invalid Undo/Redo snapshot.",
                snapshot
            );
            return false;
        }
    
        const getLinkKey = (fromNoteId, toNoteId) =>
            `${String(fromNoteId)}::${String(toNoteId)}`;
    
        const getNotePatch = (note) => ({
            title: note.title,
            body: note.body ?? "",
            user_note: note.userNote ?? "",
    
            x: Number(note.x) || 0,
            y: Number(note.y) || 0,
    
            is_locked: Boolean(note.locked),
            is_pinned: Boolean(note.pinned),
    
            // null is important when Undo removes a Cluster.
            cluster_id: note.clusterId ?? null,
        });
    
        const getNoteCreatePayload = (note) => ({
            title: note.title,
            body: note.body ?? "",
            user_note: note.userNote ?? "",
    
            x: Number(note.x) || 0,
            y: Number(note.y) || 0,
    
            source_type: note.sourceType || "pdf",
            source_name:
                note.sourceName ||
                note.title,
    
            file_url: note.fileUrl || null,
            file_size: note.fileSize ?? null,
            chunks_added: note.chunksAdded ?? null,
            db_total: note.dbTotal ?? null,
    
            is_locked: Boolean(note.locked),
            is_pinned: Boolean(note.pinned),
            cluster_id: note.clusterId ?? null,
        });
    
        try {
            const currentNoteIds = new Set(
                notes.map((note) => String(note.id))
            );
    
            const targetNoteIds = new Set(
                snapshot.notes.map((note) =>
                    String(note.id)
                )
            );
    
            const sameNoteSet =
                currentNoteIds.size === targetNoteIds.size &&
                [...targetNoteIds].every((noteId) =>
                    currentNoteIds.has(noteId)
                );
    
            const currentLinksByKey = new Map(
                links.map((link) => [
                    getLinkKey(
                        link.fromNoteId,
                        link.toNoteId
                    ),
                    link,
                ])
            );
    
            const targetLinksByKey = new Map(
                snapshot.links.map((link) => [
                    getLinkKey(
                        link.fromNoteId,
                        link.toNoteId
                    ),
                    link,
                ])
            );
    
            const sameLinkSet =
                currentLinksByKey.size ===
                    targetLinksByKey.size &&
                [...targetLinksByKey.keys()].every(
                    (key) => currentLinksByKey.has(key)
                );
    
            /*
             * FAST PATH
             *
             * Cluster, Uncluster, moving Notes, Lock, Pin Top,
             * Auto Arrange, Pan and Zoom do not add or delete Notes.
             *
             * Therefore, update the existing Notes in place.
             * Do not delete and recreate the whole Canvas.
             */
            if (sameNoteSet) {
                const restoredNotes = [];

                const currentNotesByIdForFastPath =
                    new Map(
                        notes.map((note) => [
                            String(note.id),
                            note,
                        ])
                    );

                for (const snapshotNote of snapshot.notes) {
                    const currentNote =
                        currentNotesByIdForFastPath.get(
                            String(snapshotNote.id)
                        );

                    if (!currentNote) {
                        throw new Error(
                            `Could not find note "${snapshotNote.title}" while restoring history.`
                        );
                    }

                    /*
                     * Pan/Zoom histories do not change any database field.
                     * Moving one Note should PATCH that Note only, rather
                     * than PATCHing every Note on the board. This keeps Undo
                     * fast and greatly reduces the window for repeat clicks.
                     */
                    const needsDatabaseUpdate =
                        currentNote.title !==
                            snapshotNote.title ||
                        (currentNote.body ?? "") !==
                            (snapshotNote.body ?? "") ||
                        (currentNote.userNote ?? "") !==
                            (snapshotNote.userNote ?? "") ||
                        Number(currentNote.x) !==
                            Number(snapshotNote.x) ||
                        Number(currentNote.y) !==
                            Number(snapshotNote.y) ||
                        Boolean(currentNote.locked) !==
                            Boolean(snapshotNote.locked) ||
                        Boolean(currentNote.pinned) !==
                            Boolean(snapshotNote.pinned) ||
                        (currentNote.clusterId ?? null) !==
                            (snapshotNote.clusterId ?? null);

                    let updatedNote = null;

                    if (needsDatabaseUpdate) {
                        updatedNote =
                            await updateNoteInDatabase(
                                snapshotNote.id,
                                getNotePatch(snapshotNote)
                            );

                        if (!updatedNote) {
                            throw new Error(
                                `Could not restore note "${snapshotNote.title}".`
                            );
                        }
                    }

                    restoredNotes.push({
                        ...currentNote,
                        ...snapshotNote,
                        ...(updatedNote || {}),

                        // Database response does not store selection.
                        selected: Boolean(
                            snapshotNote.selected
                        ),
                    });
                }
    
                /*
                 * Only touch links when the history operation
                 * actually changed the links.
                 */
                if (!sameLinkSet) {
                    for (const [
                        key,
                        currentLink,
                    ] of currentLinksByKey) {
                        if (
                            !targetLinksByKey.has(key)
                        ) {
                            await apiRequest(
                                `/links/${currentLink.id}`,
                                {
                                    method: "DELETE",
                                }
                            );
                        }
                    }
    
                    for (const [
                        key,
                        targetLink,
                    ] of targetLinksByKey) {
                        if (
                            !currentLinksByKey.has(key)
                        ) {
                            await apiRequest("/links", {
                                method: "POST",
                                body: JSON.stringify({
                                    from_note_id:
                                        targetLink.fromNoteId,
    
                                    to_note_id:
                                        targetLink.toNoteId,
                                }),
                            });
                        }
                    }
    
                    await loadLinksFromDatabase();
                }
    
                setNotes(restoredNotes);
    
                setBoardOffset({
                    ...(snapshot.boardOffset || {
                        x: 0,
                        y: 0,
                    }),
                });
    
                setBoardScale(
                    Number(snapshot.boardScale) || 1
                );
    
                return true;
            }
    
            /*
             * FULL RECONCILIATION
             *
             * This branch is used when Undo/Redo adds or removes
             * Notes, such as Create Note or Delete Note.
             *
             * It preserves all Notes that still exist instead of
             * deleting the entire Canvas.
             */
    
            // Links must be removed before deleting Notes because
            // note_links may contain foreign keys to public.notes.
            for (const currentLink of links) {
                await apiRequest(
                    `/links/${currentLink.id}`,
                    {
                        method: "DELETE",
                    }
                );
            }
    
            const currentNotesById = new Map(
                notes.map((note) => [
                    String(note.id),
                    note,
                ])
            );
    
            /*
             * Delete only Notes that should not exist
             * in the target snapshot.
             */
            for (const currentNote of notes) {
                if (
                    !targetNoteIds.has(
                        String(currentNote.id)
                    )
                ) {
                    await apiRequest(
                        `/notes/${currentNote.id}`,
                        {
                            method: "DELETE",
                        }
                    );
                }
            }
    
            /*
             * snapshot ID -> actual database ID
             *
             * A restored deleted Note receives a new UUID, so its
             * old snapshot ID must be mapped to the new UUID.
             */
            const noteIdMap = new Map();
            const restoredNotes = [];
    
            for (const snapshotNote of snapshot.notes) {
                const snapshotNoteId = String(
                    snapshotNote.id
                );
    
                let restoredNote;
    
                if (
                    currentNotesById.has(snapshotNoteId)
                ) {
                    restoredNote =
                        await updateNoteInDatabase(
                            snapshotNote.id,
                            getNotePatch(snapshotNote)
                        );
    
                    if (!restoredNote) {
                        throw new Error(
                            `Could not update note "${snapshotNote.title}".`
                        );
                    }
                } else {
                    const data = await apiRequest(
                        "/notes",
                        {
                            method: "POST",
                            body: JSON.stringify(
                                getNoteCreatePayload(
                                    snapshotNote
                                )
                            ),
                        }
                    );
    
                    restoredNote =
                        convertDatabaseNoteToCanvasNote(
                            data.note
                        );
                }
    
                noteIdMap.set(
                    snapshotNoteId,
                    restoredNote.id
                );
    
                restoredNotes.push({
                    ...snapshotNote,
                    ...restoredNote,
                    selected: Boolean(
                        snapshotNote.selected
                    ),
                });
            }
    
            /*
             * Recreate the target links using the actual UUIDs.
             */
            for (const snapshotLink of snapshot.links) {
                const fromNoteId = noteIdMap.get(
                    String(snapshotLink.fromNoteId)
                );
    
                const toNoteId = noteIdMap.get(
                    String(snapshotLink.toNoteId)
                );
    
                if (!fromNoteId || !toNoteId) {
                    throw new Error(
                        "Could not restore a Note link."
                    );
                }
    
                await apiRequest("/links", {
                    method: "POST",
                    body: JSON.stringify({
                        from_note_id: fromNoteId,
                        to_note_id: toNoteId,
                    }),
                });
            }
    
            /*
             * Reload Cabinet and link records, then restore
             * selection using the reconstructed Notes.
             */
            await loadNotesFromDatabase();
            await loadLinksFromDatabase();
    
            setNotes(restoredNotes);
    
            setBoardOffset({
                ...(snapshot.boardOffset || {
                    x: 0,
                    y: 0,
                }),
            });
    
            setBoardScale(
                Number(snapshot.boardScale) || 1
            );
    
            return true;
        } catch (error) {
            console.error(
                "Restore snapshot failed:",
                error
            );
    
            alert(
                `Undo/Redo failed: ${
                    error.message ||
                    "Unknown restore error."
                }`
            );
    
            /*
             * Reload the real database state so the UI does not
             * remain half-restored.
             */
            await loadNotesFromDatabase();
            await loadLinksFromDatabase();
    
            return false;
        }
    };

    /** When file upload success it will be package in the way we want so later can put into the PGSQL*/
    const handleUploadSuccess =
    async (
        uploadedFile,
        uploadResult
    ) => {
        const temporaryUploadId = uploadResult?.temporaryUploadId;
        if (uploadResult?.ingestStatus === "indexing") {
            const sourceType = getUploadedSourceType(
                uploadedFile.name,
                uploadResult?.sourceType
            );

            const temporaryNote = {
                id: temporaryUploadId,
                title: uploadedFile.name,
                body: "Uploading and indexing this document. You can continue working on the canvas.",
                userNote: "",
                x: 260 + notes.length * 35,
                y: 120 + notes.length * 35,
                selected: true,

                sourceType,
                sourceName: uploadedFile.name,
                fileUrl: "",
                fileSize: uploadedFile.size,
                chunksAdded: null,
                dbTotal: null,
                ingestStatus: "indexing",
                isTemporary: true,
            };

            setNotes((prevNotes) => [...prevNotes, temporaryNote]);

            setFiles((prevFiles) => [
                {
                    id: temporaryUploadId,
                    title: uploadedFile.name,
                    date: new Date().toISOString().slice(0, 10),
                    size: formatFileSize(uploadedFile.size),
                    sourceType,
                    sourceName: uploadedFile.name,
                    fileUrl: "",
                    noteId: temporaryUploadId,
                },
                ...prevFiles,
            ]);

            return;
        }
        if (uploadResult?.success === false) {
            if (temporaryUploadId) {
                setNotes((prevNotes) =>
                    prevNotes.map((note) =>
                        note.id === temporaryUploadId
                            ? {
                                ...note,
                                body:
                                    "This document failed to upload or index.\n\n" +
                                    (uploadResult.error || ""),
                                ingestStatus: "failed",
                            }
                            : note
                    )
                );

                return;
            }

            alert(
                `${uploadedFile.name} failed to upload or index.\n` +
                `${uploadResult.error || ""}`
            );

            return;
        }
        const sourceType =
            getUploadedSourceType(
                uploadedFile.name,
                uploadResult
                    ?.sourceType
            );

        const sourceDescription = {
            pdf:
                "PDF document",

            word:
                "Word document",

            excel:
                "Excel workbook",

            powerpoint:
                "PowerPoint presentation",

            document:
                "Document",
        }[sourceType] ||
        "Document";

        /*
          Different ingestion services
          may return extracted text using
          different property names.
        */
        const extractedText =
            String(
                uploadResult
                    ?.summary ||
                    uploadResult
                        ?.extractedText ||
                    uploadResult
                        ?.extracted_text ||
                    uploadResult?.text ||
                    ""
            ).trim();

        const noteBody =
            extractedText
                ? extractedText.slice(
                      0,
                      10000
                  )
                : uploadResult
                      ?.ingested
                  ? `${sourceDescription} uploaded and indexed successfully.`
                  : `${sourceDescription} uploaded successfully. Open the original file to view its contents.`;

        const newNoteData = {
            title: uploadedFile.name,
            body: noteBody,
            user_note: "",
            x: 260 + notes.length * 35,
            y: 120 + notes.length * 35,

            source_type: sourceType,
            source_name:
                uploadResult?.file ||
                uploadResult?.originalName ||
                uploadedFile.name,

            file_url: uploadResult?.fileUrl || "",
            file_size: uploadResult?.fileSize ?? uploadedFile.size,
            chunks_added:
                uploadResult?.chunks_added ??
                uploadResult?.chunksAdded ??
                null,

            db_total:
                uploadResult?.db_total ??
                uploadResult?.dbTotal ??
                null,

            ingest_status: uploadResult?.ingested ? "indexed" : "uploaded",
        };

        try {
            const data =
                await apiRequest(
                    "/notes",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                newNoteData
                            ),
                    }
                );

            const newCanvasNote =
                convertDatabaseNoteToCanvasNote(
                    data.note
                );

            setNotes((prevNotes) => {
                if (temporaryUploadId) {
                    return prevNotes.map((note) =>
                        note.id === temporaryUploadId
                            ? {
                                ...newCanvasNote,
                                selected: note.selected,
                            }
                            : note
                    );
                }

                return [...prevNotes, newCanvasNote];
            });

            const newCabinetFile =
                convertNoteToCabinetFile(
                    newCanvasNote
                );

            setFiles((prevFiles) => {
                if (temporaryUploadId) {
                    return prevFiles.map((file) =>
                        file.noteId === temporaryUploadId
                            ? {
                                ...newCabinetFile,
                                noteId: newCanvasNote.id,
                            }
                            : file
                    );
                }

                return [newCabinetFile, ...prevFiles];
            });

            if (
                uploadResult?.warning
            ) {
                alert(
                    `${sourceDescription} uploaded to the Canvas.\n\n${uploadResult.warning}`
                );
            }
        } catch (error) {
            console.error(
                "Create uploaded document note error:",
                error
            );

            alert(
                "The file uploaded, but the Canvas note could not be created."
            );
        }
    };
    /***************************************************************************/
    const formatFileSize = (bytes) => {
        if (!bytes) return "";

        const kb = bytes / 1024;
        if (kb < 1024) {
            return `${Math.round(kb)} KB`;
        }

        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";

        return new Date(dateString).toISOString().slice(0, 10);
    };

    const convertNoteToCabinetFile = (note) => {
        return {
            id: note.id,
            title: note.title,
            date: formatDate(note.createdAt),
            size: formatFileSize(note.fileSize),
            sourceType: note.sourceType,
            sourceName: note.sourceName,
            fileUrl: note.fileUrl,
            noteId: note.id,
        };
    };
    /***************************************************************************/
    /** When click the Note if the current note is selected then change back to light color else change to darker color */
    const handleNoteClick = (noteId) => {
        setNotes((prevNotes) => 
            prevNotes.map((note) => 
                note.id === noteId ? { ...note, selected: !note.selected } : note
            )
        );
    };
    /***************************************************************************/
    /** When click the File on the left it will show up on the Canvas (x and y in the function I set it this way so it will keep shift buttom right a bit so it wont overlap) */
    const handleFileClick = (file) => {
        const existingNote = notes.find((note) => note.id === file.noteId);

        if (!existingNote) {
            return;
        }

        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === existingNote.id
                    ? { ...note, selected: true }
                    : note
            )
        );

        handleOpenNote(existingNote);
    };
    /***************************************************************************/
    /** This function will send a selected database document to the main board and save it to Supabase */
    const handleSendDocToBoard =
    async (doc) => {
        const isOpenAlex =
            doc.external_provider ===
                "OpenAlex" ||
            doc.source ===
                "OpenAlex" ||
            doc.is_external === true;

        const sourceUrl =
            doc.file_url ||
            doc.source_url ||
            "";

        const before =
            getSnapshot();

        const newNoteData = {
            title:
                doc.title ||
                "Untitled Source",

            body:
                doc.description ||
                "No abstract or preview text is available.",

            user_note: "",

            x:
                300 +
                notes.length *
                    30,

            y:
                120 +
                notes.length *
                    30,

            source_type:
                isOpenAlex
                    ? "openalex"
                    : doc.content_type ||
                      "document",

            source_name:
                isOpenAlex
                    ? doc.openalex_id ||
                      doc.doi ||
                      doc.id
                    : doc.source ||
                      doc.title,

            file_url:
                sourceUrl,

            file_size:
                null,

            chunks_added:
                null,

            db_total:
                null,
        };

        try {
            const data =
                await apiRequest(
                    "/notes",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                newNoteData
                            ),
                    }
                );

            const newCanvasNote =
                convertDatabaseNoteToCanvasNote(
                    data.note
                );

            setNotes((prevNotes) => [
                ...prevNotes,
                newCanvasNote,
            ]);

            const newCabinetFile =
                convertNoteToCabinetFile(
                    newCanvasNote
                );

            setFiles((prevFiles) => [
                newCabinetFile,
                ...prevFiles,
            ]);

            pushUndoSnapshot(before);
        } catch (error) {
            console.error(
                "Create database note error:",
                error
            );

            alert(
                "Failed to send the source to the board."
            );
        }
    };

    // const handleSendDocToBoard = async (doc) => {
    //     const x = 300 + notes.length * 30;
    //     const y = 120 + notes.length * 30;

    //     const { data, error } = await supabase
    //         .from("canvas_notes")
    //         .insert([
    //             {
    //                 document_id: doc.id,
    //                 title: doc.title,
    //                 body: doc.description || "Note from database source.",
    //                 x_position: x,
    //                 y_position: y,
    //                 selected: false,
    //             },
    //         ])
    //         .select()
    //         .single();

    //     if (error) {
    //         console.error("Failed to save note:", error);
    //         return;
    //     }

    //     const newNote = {
    //         id: data.id,
    //         documentId: data.document_id,
    //         title: data.title,
    //         body: data.body,
    //         x: data.x_position,
    //         y: data.y_position,
    //         selected: data.selected,
    //     };

    //     setNotes((prevNotes) => [...prevNotes, newNote]);
    // };
    /***************************************************************************/
    const normalizeSourceSearchText = (value) => {
        return String(value ?? "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/\s+/g, " ")
            .toLocaleLowerCase()
            .trim();
    };
    
    const sourceSearchTerms = normalizeSourceSearchText(
        sourceSearchQuery
    )
        .split(" ")
        .filter(Boolean);
    
    /*
      Search only filters the Canvas while Research Tools
      is active. Switching back to Canvas Tools displays
      every Note again without deleting the search text.
    */
    const isSourceSearchActive =
        activeToolMode === "research" &&
        sourceSearchTerms.length > 0;
    
    const visibleNotes = isSourceSearchActive
        ? notes.filter((note) => {
              const titleAndAbstract =
                  normalizeSourceSearchText(
                      `${note.title ?? ""} ${note.body ?? ""}`
                  );
    
              return sourceSearchTerms.every((term) =>
                  titleAndAbstract.includes(term)
              );
          })
        : notes;
    
    /*
      Only display a Link when both endpoint Notes are
      visible in the current search results.
    */
    const visibleNoteIds = new Set(
        visibleNotes.map((note) => String(note.id))
    );
    
    const visibleLinks = links.filter(
        (link) =>
            visibleNoteIds.has(String(link.fromNoteId)) &&
            visibleNoteIds.has(String(link.toNoteId))
    );
    
    const selectedNotesCount = visibleNotes.filter(
        (note) => note.selected
    ).length;
    
    const zoomPercentage = Math.round(boardScale * 100);
    
    const hoveredNote = visibleNotes.find(
        (note) => note.id === hoveredNoteId
    );
    
    const openedNote = notes.find(
        (note) => note.id === openedNoteId
    );
    /***************************************************************************/
    const handleSendMessage = async () => {

        if (isAiThinking) {
            return;
        }

        if (!chatInput.trim()) {
            return;
        };

        const question = chatInput;

        const userMessage = {
            id: Date.now(),
            role: "user",
            text: chatInput,
        };

        const chatHistoryForApi = chatMessages.slice(-8).map((message) => ({
            role: message.role,
            content: message.text,
        }));

        setChatMessages((prevMessages) => [...prevMessages, userMessage]);
        setChatInput("");
        setIsAiThinking(true);

        let timeoutId = null;

        try {
            // const isGeneralGreeting = /^(hi|hello|hey|how are you|thanks|thank you)\??$/i.test(question.trim());
            // const shouldUseRag = selectedNotesCount > 0 && !isGeneralGreeting;

            // console.log("CHAT DEBUG:", {
            //     question,
            //     selectedNotesCount,
            //     use_rag: shouldUseRag,
            //     chat_history: chatHistoryForApi,
            // });

            const selectedSourceNames = notes
                .filter(
                    (note) =>
                        note.selected &&
                        note.sourceName &&
                        note.sourceType !== "openalex" &&
                        note.ingestStatus !== "indexing" &&
                        note.ingestStatus !== "failed" &&
                        !note.isTemporary
                )
                .map((note) => note.sourceName);

            const uniqueSelectedSourceNames = [...new Set(selectedSourceNames)];

            const shouldUseRag = uniqueSelectedSourceNames.length > 0;

            const selectedSourcesText =
                uniqueSelectedSourceNames.length > 0
                    ? uniqueSelectedSourceNames
                        .map((name, index) => `${index + 1}. ${name}`)
                        .join("\n")
                    : "No selected sources.";

            const enhancedQuestion = shouldUseRag
                ? `The user has selected these source files:\n${selectedSourcesText}\n\nAnswer using only these selected sources.\n\nUser question: ${question}`
                : question;

            console.log("CHAT RAG DEBUG:", {
                question,
                shouldUseRag,
                selectedSources: uniqueSelectedSourceNames,
                sourceFilter: uniqueSelectedSourceNames[0] || "",
                sourceFilters: uniqueSelectedSourceNames,
                enhancedQuestion,
            });

            const abortController = new AbortController();

            timeoutId = window.setTimeout(() => {
                abortController.abort();
            }, 90000);

            const data = await apiRequest("/ai/query-text", {
                
                method: "POST",
                signal: abortController.signal,
                body: JSON.stringify({
                    question: enhancedQuestion,
                    top_k: 5,
                    use_rag: shouldUseRag,
                    source_filters: uniqueSelectedSourceNames,
                    source_filter: uniqueSelectedSourceNames[0] || "",
                    chat_history: chatHistoryForApi,
                    canvas_id: "default",
                }),
            });
            console.log("AI RESPONSE DATA:", data);

            const aiMessage = {
                id: Date.now() + 1,
                role: "ai",
                text: data.answer || "No answer returned.",
                sources: data.sources || [],
                mode: data.mode,
            };

            setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
        } catch (error) {
            console.error("AI chat error:", error);

            const errorMessage = {
                id: Date.now() + 1,
                role: "ai",
                text:
                    error?.message ||
                    "Failed to get an answer from the AI service.",
            };

            setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            setIsAiThinking(false);
        }
    };

    const renderTextWithCitations = (value, sources = []) => {
        if (typeof value !== "string") {
            return value;
        }

        const parts = value.split(/(\[\s*S\d+(?:\s*,\s*S\d+)*\s*\])/gi);

        return parts.map((part, index) => {
            const groupMatch = part.match(/^\[\s*S\d+(?:\s*,\s*S\d+)*\s*\]$/i);

            if (!groupMatch) {
                return part;
            }

            const citationLabels = part.match(/S\d+/gi) || [];

            return (
                <span key={`${part}-${index}`} className="Citation_Group">
                    {citationLabels.map((label, labelIndex) => {
                        const normalizedLabel = label.toUpperCase();
                        const citationNumber = Number(normalizedLabel.replace("S", ""));

                        const source =
                            sources.find((item) => item.citation_id === normalizedLabel) ||
                            sources[citationNumber - 1];

                        const button = source ? (
                            <button
                                type="button"
                                className="Citation_Button"
                                onClick={() => setActiveCitationSource(source)}
                            >
                                {normalizedLabel}
                            </button>
                        ) : (
                            normalizedLabel
                        );

                        return (
                            <React.Fragment key={`${normalizedLabel}-${labelIndex}`}>
                                {labelIndex > 0 ? " " : ""}
                                [{button}]
                            </React.Fragment>
                        );
                    })}
                </span>
            );
        });
    };

    const renderChildrenWithCitations = (children, sources = []) => {
        return React.Children.map(children, (child) => {
            if (typeof child === "string") {
                return renderTextWithCitations(child, sources);
            }

            return child;
        });
    };

    const renderAiMarkdown = (text, sources = []) => {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p({ children }) {
                        return (
                            <p>
                                {renderChildrenWithCitations(children, sources)}
                            </p>
                        );
                    },

                    li({ children }) {
                        return (
                            <li>
                                {renderChildrenWithCitations(children, sources)}
                            </li>
                        );
                    },
                }}
            >
                {text}
            </ReactMarkdown>
        );
    };
    /***************************************************************************/
    const handleChatKeyDown = (event) => {
        if (event.key == "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    }
    /***************************************************************************/
    const handleFileDragStart = (event, file) => {
        event.dataTransfer.setData("application/json", JSON.stringify(file));
        event.dataTransfer.effectAllowed = "copy";
    };
    /***************************************************************************/
    const handleCanvasDragOver = (event) => {
        event.preventDefault();
    };
    /***************************************************************************/
    const handleCanvasDrop = async (event) => {
        event.preventDefault();

        const fileData = event.dataTransfer.getData("application/json");

        if (!fileData) {
            return;
        }

        const file = JSON.parse(fileData);

        const canvasRect = event.currentTarget.getBoundingClientRect();

        const x = (event.clientX - canvasRect.left - boardOffset.x) / boardScale;
        const y = (event.clientY - canvasRect.top - boardOffset.y) / boardScale;

        const newNoteData = {
            title: file.title,
            body: "Note or AI summary from the source",
            user_note: "",
            x,
            y,

            source_type: file.sourceType || "pdf",
            source_name: file.sourceName || file.title,
            file_url: file.fileUrl || "",
            file_size: file.fileSize || null,
        };

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);

            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);
        } catch (error) {
            console.error("Create dropped note error:", error);
            alert("Failed to create note.");
        }
    };
    /***************************************************************************/
    const handleNoteMouseDown = (
        event,
        note
    ) => {
        event.stopPropagation();

        if (
            historyBusyRef.current ||
            dragSaveInProgressRef.current
        ) {
            return;
        }
    
        setHasDraggedNote(false);
    
        if (note.locked) {
            return;
        }
    
        const notesToMove = note.clusterId
            ? notes.filter(
                  (candidate) =>
                      candidate.clusterId ===
                      note.clusterId
              )
            : [note];
    
        /*
          A Cluster containing a locked Note cannot move,
          because group movement would otherwise move the
          locked Note too.
        */
        if (
            notesToMove.some(
                (candidate) => candidate.locked
            )
        ) {
            alert(
                "This cluster contains a locked note. Unlock it before moving the cluster."
            );
            return;
        }
    
        const canvasRect = event.currentTarget
            .closest(".Canvas_Center")
            .getBoundingClientRect();
    
        const startWorldX =
            (event.clientX -
                canvasRect.left -
                boardOffset.x) /
            boardScale;
    
        const startWorldY =
            (event.clientY -
                canvasRect.top -
                boardOffset.y) /
            boardScale;
    
        dragStartSnapshot.current = getSnapshot();
    
        clusterDragRef.current = {
            noteIds: notesToMove.map(
                (candidate) => candidate.id
            ),
    
            startWorldX,
            startWorldY,
    
            startPositions: Object.fromEntries(
                notesToMove.map((candidate) => [
                    candidate.id,
                    {
                        x: candidate.x,
                        y: candidate.y,
                    },
                ])
            ),
    
            lastDeltaX: 0,
            lastDeltaY: 0,
            hasMoved: false,
        };
    
        setDraggingNoteId(note.id);
    };
    /***************************************************************************/
    const handleCanvasMouseMove = (event) => {
        if (draggingNoteId !== null) {
            const dragInfo =
                clusterDragRef.current;
    
            if (
                dragInfo.noteIds.length === 0
            ) {
                return;
            }
    
            const canvasRect =
                event.currentTarget.getBoundingClientRect();
    
            const currentWorldX =
                (event.clientX -
                    canvasRect.left -
                    boardOffset.x) /
                boardScale;
    
            const currentWorldY =
                (event.clientY -
                    canvasRect.top -
                    boardOffset.y) /
                boardScale;
    
            const deltaX =
                currentWorldX -
                dragInfo.startWorldX;
    
            const deltaY =
                currentWorldY -
                dragInfo.startWorldY;
    
            dragInfo.lastDeltaX = deltaX;
            dragInfo.lastDeltaY = deltaY;
    
            if (
                Math.abs(deltaX) > 0.5 ||
                Math.abs(deltaY) > 0.5
            ) {
                dragInfo.hasMoved = true;
                setHasDraggedNote(true);
            }
    
            setNotes((prevNotes) =>
                prevNotes.map((note) => {
                    const startPosition =
                        dragInfo.startPositions[
                            note.id
                        ];
    
                    if (!startPosition) {
                        return note;
                    }
    
                    return {
                        ...note,
    
                        x:
                            startPosition.x +
                            deltaX,
    
                        y:
                            startPosition.y +
                            deltaY,
                    };
                })
            );
    
            return;
        }
    
        if (isPanningBoard) {
            const nextOffset = {
                x:
                    event.clientX -
                    panStart.x,

                y:
                    event.clientY -
                    panStart.y,
            };

            const panStartSnapshot =
                panStartSnapshotRef.current;

            if (
                panStartSnapshot &&
                (Math.abs(
                    nextOffset.x -
                        panStartSnapshot.boardOffset.x
                ) > 0.5 ||
                    Math.abs(
                        nextOffset.y -
                            panStartSnapshot.boardOffset.y
                    ) > 0.5)
            ) {
                panHasMovedRef.current = true;
            }

            setBoardOffset(nextOffset);
        }
    };
    /***************************************************************************/
    const handleCanvasMouseUp = async () => {
        /*
         * Copy every mutable ref into local constants BEFORE any await
         * or cleanup. The old code placed dragStartSnapshot.current
         * inside a React state callback and then immediately set the ref
         * to null, so React could append null to undoStack.
         */
        const wasDragging =
            draggingNoteId !== null;

        const dragInfo =
            clusterDragRef.current;

        const dragBeforeSnapshot =
            dragStartSnapshot.current;

        const wasPanning =
            isPanningBoard;

        const panBeforeSnapshot =
            panStartSnapshotRef.current;

        const panMoved =
            panHasMovedRef.current;

        /*
         * Reset the gesture synchronously, before the database request.
         * onMouseUp and onMouseLeave can otherwise finish the same drag
         * twice while the first PATCH request is still pending.
         */
        setDraggingNoteId(null);
        setIsPanningBoard(false);

        clusterDragRef.current = {
            noteIds: [],
            startWorldX: 0,
            startWorldY: 0,
            startPositions: {},
            lastDeltaX: 0,
            lastDeltaY: 0,
            hasMoved: false,
        };

        dragStartSnapshot.current = null;
        panStartSnapshotRef.current = null;
        panHasMovedRef.current = false;

        if (
            wasPanning &&
            panMoved &&
            panBeforeSnapshot
        ) {
            pushUndoSnapshot(
                panBeforeSnapshot
            );
        }

        if (
            !wasDragging ||
            !dragInfo.hasMoved ||
            dragInfo.noteIds.length === 0
        ) {
            return;
        }

        if (dragSaveInProgressRef.current) {
            return;
        }

        dragSaveInProgressRef.current = true;

        try {
            const movedNotes =
                dragInfo.noteIds
                    .map((noteId) => {
                        const startPosition =
                            dragInfo.startPositions[noteId];

                        if (!startPosition) {
                            return null;
                        }

                        const currentNote = notes.find(
                            (note) => String(note.id) === String(noteId)
                        );

                        if (!currentNote) {
                            return null;
                        }

                        return {
                            id: noteId,
                            x: startPosition.x + dragInfo.lastDeltaX,
                            y: startPosition.y + dragInfo.lastDeltaY,
                            isTemporary: Boolean(currentNote.isTemporary),
                        };
                    })
                    .filter(Boolean);

            if (movedNotes.length === 0) {
                return;
            }

            const databaseMovedNotes = movedNotes.filter(
                (note) => !note.isTemporary
            );

            if (databaseMovedNotes.length === 0) {
                return;
            }

            const updateResults =
                await Promise.all(
                    databaseMovedNotes.map((note) =>
                        updateNoteInDatabase(
                            note.id,
                            {
                                x: note.x,
                                y: note.y,
                            }
                        )
                    )
                );

            const failed = updateResults.some(
                (result) => !result
            );

            if (failed) {
                await loadNotesFromDatabase();

                alert(
                    "The cluster position could not be fully saved."
                );
                return;
            }

            if (dragBeforeSnapshot) {
                pushUndoSnapshot(
                    dragBeforeSnapshot
                );
            }
        } finally {
            dragSaveInProgressRef.current = false;
        }
    };
    /***************************************************************************/
    const handleCanvasWheel = (event) => {
        event.preventDefault();

        if (historyBusyRef.current) {
            return;
        }

        const zoomSpeed = 0.0015;
        const minScale = 0.4;
        const maxScale = 2.5;

        const canvasRect =
            event.currentTarget.getBoundingClientRect();

        const mouseX =
            event.clientX - canvasRect.left;
        const mouseY =
            event.clientY - canvasRect.top;

        const worldX =
            (mouseX - boardOffset.x) /
            boardScale;
        const worldY =
            (mouseY - boardOffset.y) /
            boardScale;

        const nextScale = Math.min(
            maxScale,
            Math.max(
                minScale,
                boardScale -
                    event.deltaY * zoomSpeed
            )
        );

        if (
            Math.abs(nextScale - boardScale) <
            0.000001
        ) {
            return;
        }

        if (!zoomHistoryActiveRef.current) {
            const saved = pushUndoSnapshot(
                getSnapshot(),
                { source: "zoom" }
            );

            zoomHistoryActiveRef.current =
                saved;
        }

        if (zoomHistoryTimerRef.current) {
            window.clearTimeout(
                zoomHistoryTimerRef.current
            );
        }

        zoomHistoryTimerRef.current =
            window.setTimeout(() => {
                zoomHistoryActiveRef.current =
                    false;
                zoomHistoryTimerRef.current =
                    null;
            }, 180);

        const nextOffsetX =
            mouseX - worldX * nextScale;
        const nextOffsetY =
            mouseY - worldY * nextScale;

        setBoardScale(nextScale);
        setBoardOffset({
            x: nextOffsetX,
            y: nextOffsetY,
        });
    };
    /***************************************************************************/
    const handleBoardMouseDown = (event) => {
        const isCanvasBackground =
            event.target.classList.contains(
                "Canvas_Center"
            ) ||
            event.target.classList.contains(
                "Canvas_World"
            );

        if (
            !isCanvasBackground ||
            historyBusyRef.current ||
            dragSaveInProgressRef.current
        ) {
            return;
        }

        panStartSnapshotRef.current =
            getSnapshot();
        panHasMovedRef.current = false;

        setIsPanningBoard(true);
        setPanStart({
            x: event.clientX - boardOffset.x,
            y: event.clientY - boardOffset.y,
        });
    };
    /***************************************************************************/
    const handleResetView = () => {
        if (
            historyBusyRef.current ||
            (boardOffset.x === 0 &&
                boardOffset.y === 0 &&
                boardScale === 1)
        ) {
            return;
        }

        pushUndoSnapshot(getSnapshot());

        setBoardOffset({ x: 0, y: 0 });
        setBoardScale(1);
    };
    /***************************************************************************/
    const handleLinkSelectedNotes = async () => {
        const selected = notes.filter(
            (note) => note.selected
        );
    
        if (selected.length < 2) {
            alert(
                "Please select at least 2 notes to link or unlink."
            );
            return;
        }
    
        /*
          Preserve the current behavior:
    
          2 selected notes:
          A — B
    
          3 selected notes:
          A — B — C
    
          4 selected notes:
          A — B — C — D
        */
        const selectedPairs = selected
            .slice(0, -1)
            .map((note, index) => ({
                fromNoteId: note.id,
                toNoteId: selected[index + 1].id,
            }));
    
        const pairStates = selectedPairs.map(
            (pair) => ({
                ...pair,
    
                existingLinks: getLinksBetween(
                    pair.fromNoteId,
                    pair.toNoteId
                ),
            })
        );
    
        /*
          If every selected pair already has a Link,
          clicking the button means Unlink.
    
          If at least one pair is missing,
          clicking the button means Link.
        */
        const shouldUnlink = pairStates.every(
            (pair) =>
                pair.existingLinks.length > 0
        );
    
        const before = getSnapshot();
    
        /* =====================================================
           UNLINK
           ===================================================== */
        if (shouldUnlink) {
            /*
              Remove duplicates as well, including the unlikely
              case where both A → B and B → A exist.
            */
            const linksToDelete = Array.from(
                new Map(
                    pairStates
                        .flatMap(
                            (pair) =>
                                pair.existingLinks
                        )
                        .map((link) => [
                            String(link.id),
                            link,
                        ])
                ).values()
            );
    
            const successfullyDeletedLinks = [];
    
            try {
                for (const link of linksToDelete) {
                    const deleted =
                        await deleteLinkInDatabase(
                            link.id
                        );
    
                    if (!deleted) {
                        throw new Error(
                            "A selected link could not be deleted."
                        );
                    }
    
                    successfullyDeletedLinks.push(
                        link
                    );
                }
    
                const deletedLinkIds = new Set(
                    successfullyDeletedLinks.map(
                        (link) => String(link.id)
                    )
                );
    
                setLinks((prevLinks) =>
                    prevLinks.filter(
                        (link) =>
                            !deletedLinkIds.has(
                                String(link.id)
                            )
                    )
                );
    
                pushUndoSnapshot(before);
            } catch (error) {
                console.error(
                    "Unlink selected notes error:",
                    error
                );
    
                /*
                  Roll back any links that were already deleted
                  if another deletion failed.
                */
                for (const deletedLink of successfullyDeletedLinks) {
                    await createLinkInDatabase(
                        deletedLink.fromNoteId,
                        deletedLink.toNoteId
                    );
                }
    
                await loadLinksFromDatabase();
    
                alert(
                    "Failed to unlink the selected notes."
                );
            }
    
            return;
        }
    
        /* =====================================================
           LINK
           ===================================================== */
    
        const missingPairs = pairStates.filter(
            (pair) =>
                pair.existingLinks.length === 0
        );
    
        const successfullyCreatedLinks = [];
    
        try {
            for (const pair of missingPairs) {
                const createdLink =
                    await createLinkInDatabase(
                        pair.fromNoteId,
                        pair.toNoteId
                    );
    
                if (!createdLink) {
                    throw new Error(
                        "A selected link could not be created."
                    );
                }
    
                successfullyCreatedLinks.push(
                    createdLink
                );
            }
    
            if (
                successfullyCreatedLinks.length === 0
            ) {
                return;
            }
    
            setLinks((prevLinks) => [
                ...prevLinks,
                ...successfullyCreatedLinks,
            ]);
    
            pushUndoSnapshot(before);
        } catch (error) {
            console.error(
                "Link selected notes error:",
                error
            );
    
            /*
              Roll back links already created if a later
              creation fails.
            */
            for (const createdLink of successfullyCreatedLinks) {
                await deleteLinkInDatabase(
                    createdLink.id
                );
            }
    
            await loadLinksFromDatabase();
    
            alert(
                "Failed to link the selected notes."
            );
        }
    };
    /***************************************************************************/
    const getNoteById = (noteId) => {
        return notes.find((note) => note.id === noteId);
    };
    /***************************************************************************/
    /** This function deletes selected notes from both the board and Supabase */
    const handleDeleteSelectedNote = async () => {
        const selectedNotesToDelete = notes.filter(
            (note) => note.selected
        );
    
        if (selectedNotesToDelete.length === 0) {
            return;
        }
    
        const unlockedNotes = selectedNotesToDelete.filter(
            (note) => !note.locked
        );
    
        const lockedCount =
            selectedNotesToDelete.length - unlockedNotes.length;
    
        if (unlockedNotes.length === 0) {
            alert("Locked notes cannot be deleted.");
            return;
        }
    
        const before = getSnapshot();
    
        const unlockedNoteIds = unlockedNotes.map(
            (note) => note.id
        );
    
        const deleteResults = await Promise.all(
            unlockedNoteIds.map((noteId) =>
                deleteNoteFromDatabase(noteId)
            )
        );
    
        const successfullyDeletedIds =
            unlockedNoteIds.filter(
                (noteId, index) => deleteResults[index]
            );
    
        if (successfullyDeletedIds.length === 0) {
            alert("Failed to delete the selected notes.");
            return;
        }
    
        setNotes((prevNotes) =>
            prevNotes.filter(
                (note) =>
                    !successfullyDeletedIds.includes(note.id)
            )
        );
    
        setFiles((prevFiles) =>
            prevFiles.filter(
                (file) =>
                    !successfullyDeletedIds.includes(
                        file.noteId
                    )
            )
        );
    
        setLinks((prevLinks) =>
            prevLinks.filter(
                (link) =>
                    !successfullyDeletedIds.includes(
                        link.fromNoteId
                    ) &&
                    !successfullyDeletedIds.includes(
                        link.toNoteId
                    )
            )
        );
    
        pushUndoSnapshot(before);
    
        if (lockedCount > 0) {
            alert(
                `${lockedCount} locked note${
                    lockedCount === 1 ? "" : "s"
                } were not deleted.`
            );
        }
    };
    /***************************************************************************/
    const getLinksBetween = (
        firstNoteId,
        secondNoteId
    ) => {
        return links.filter((link) => {
            const sameDirection =
                String(link.fromNoteId) ===
                    String(firstNoteId) &&
                String(link.toNoteId) ===
                    String(secondNoteId);
    
            const oppositeDirection =
                String(link.fromNoteId) ===
                    String(secondNoteId) &&
                String(link.toNoteId) ===
                    String(firstNoteId);
    
            return sameDirection || oppositeDirection;
        });
    };
    
    const linkAlreadyExists = (
        fromNoteId,
        toNoteId
    ) => {
        return (
            getLinksBetween(
                fromNoteId,
                toNoteId
            ).length > 0
        );
    };
    /***************************************************************************/
    const handleOpenNote = (note) => {
        if (note.locked) {
            alert("This note is locked. Unlock it before editing.");
            return;
        }
    
        setOpenedNoteId(note.id);
        setNoteDraft(note.userNote || "");
    };
    /***************************************************************************/
    const handleCloseNote = () => {
        setOpenedNoteId(null);
        setNoteDraft("");
    };
    /***************************************************************************/
    const handleSaveNote = async () => {
        if (!openedNote || openedNote.locked) {
            alert("This note is locked and cannot be edited.");
            return;
        }
    
        const editorHtml = editorRef.current
            ? editorRef.current.innerHTML
            : "";
    
        const updatedNote = await updateNoteInDatabase(
            openedNoteId,
            {
                user_note: editorHtml,
            }
        );
    
        if (!updatedNote) {
            return;
        }
    
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === openedNoteId
                    ? {
                          ...note,
                          userNote: editorHtml,
                      }
                    : note
            )
        );
    
        setNoteDraft(editorHtml);
        handleCloseNote();
    };
    /***************************************************************************/
    const handleDeleteOpenedNote = async () => {
        if (!openedNote) {
            return;
        }
    
        if (openedNote.locked) {
            alert(
                "This note is locked. Unlock it before deleting."
            );
            return;
        }
    
        const confirmed = window.confirm(
            `Delete "${openedNote.title}"?`
        );
    
        if (!confirmed) {
            return;
        }
    
        const before = getSnapshot();
        const noteId = openedNote.id;
    
        const deleted =
            await deleteNoteFromDatabase(noteId);
    
        if (!deleted) {
            alert("Failed to delete the note.");
            return;
        }
    
        setNotes((prevNotes) =>
            prevNotes.filter(
                (note) =>
                    String(note.id) !== String(noteId)
            )
        );
    
        setFiles((prevFiles) =>
            prevFiles.filter(
                (file) =>
                    String(file.noteId) !==
                    String(noteId)
            )
        );
    
        setLinks((prevLinks) =>
            prevLinks.filter(
                (link) =>
                    String(link.fromNoteId) !==
                        String(noteId) &&
                    String(link.toNoteId) !==
                        String(noteId)
            )
        );
    
        pushUndoSnapshot(before);
    
        handleCloseNote();
    };
    /***************************************************************************/
    const handleEditorCommand = (
        command,
        value = null
    ) => {
        if (!openedNote || openedNote.locked) {
            return;
        }
    
        if (editorRef.current) {
            editorRef.current.focus();
        }
    
        document.execCommand(command, false, value);
    
        if (editorRef.current) {
            setNoteDraft(editorRef.current.innerHTML);
        }
    };
    /***************************************************************************/  
    const handleNoteToolbarCommand = (
        event,
        command,
        value = null
    ) => {
        // Prevent toolbar button from stealing the selected text.
        event.preventDefault();
    
        if (
            !editorRef.current ||
            !openedNote ||
            openedNote.locked
        ) {
            return;
        }
    
        handleEditorCommand(command, value);
    };
    /***************************************************************************/   
    const handleNoteEditorHistory = (
        event,
        command
    ) => {
        event.preventDefault();
    
        if (
            !editorRef.current ||
            !openedNote ||
            openedNote.locked
        ) {
            return;
        }
    
        // Keep the history command inside the Note editor.
        editorRef.current.focus();
    
        document.execCommand(
            command,
            false,
            null
        );
    
        // Wait until the browser finishes changing the DOM,
        // then synchronize React state with the editor.
        window.requestAnimationFrame(() => {
            if (!editorRef.current) {
                return;
            }
    
            setNoteDraft(
                editorRef.current.innerHTML
            );
        });
    };
    
    const handleNoteEditorKeyDown = (event) => {
        const isModifierPressed =
            event.metaKey || event.ctrlKey;
    
        if (!isModifierPressed) {
            return;
        }
    
        const key = event.key.toLowerCase();
    
        // Mac: Command + Z
        // Windows: Ctrl + Z
        if (key === "z" && !event.shiftKey) {
            handleNoteEditorHistory(
                event,
                "undo"
            );
    
            return;
        }
    
        // Mac: Command + Shift + Z
        // Windows: Ctrl + Shift + Z
        if (key === "z" && event.shiftKey) {
            handleNoteEditorHistory(
                event,
                "redo"
            );
    
            return;
        }
    
        // Windows alternative: Ctrl + Y
        if (key === "y") {
            handleNoteEditorHistory(
                event,
                "redo"
            );
    
            return;
        }
    
        // Mac: Command + U
        // Windows: Ctrl + U
        if (key === "u") {
            event.preventDefault();
            handleEditorCommand("underline");
        }
    };
    /***************************************************************************/   
    const handleExpandedFrameworkCommand = (
        event,
        command,
        value = null
    ) => {
        event.preventDefault();
    
        const editor = expandedFrameworkEditorRef.current;
    
        if (!editor) {
            return;
        }
    
        editor.focus();
        document.execCommand(command, false, value);
    
        setFrameworkEditorDraft(editor.innerHTML);
    };
    /***************************************************************************/
    const convertDatabaseNoteToCanvasNote = (note) => {
        const sourceType = note.source_type || "pdf";
        const sourceName = note.source_name || note.title;
    
        const noteKind =
            sourceType === "framework" ||
            sourceName === FRAMEWORK_STORAGE_SOURCE ||
            sourceName === "nexo-framework"
                ? "framework"
                : sourceType === "outline" ||
                    sourceName === OUTLINE_STORAGE_SOURCE
                  ? "outline"
                  : sourceType;
    
        return {
            id: note.id,
            title: note.title,
            body: note.body || "",
            userNote: note.user_note || "",
    
            x: Number(note.x),
            y: Number(note.y),
    
            selected: false,
            locked: Boolean(note.is_locked),
            pinned: Boolean(note.is_pinned),
    
            clusterId: note.cluster_id || null,
    
            sourceType,
            sourceName,
            noteKind,
    
            fileUrl: note.file_url || "",
            fileSize: note.file_size || null,
            chunksAdded: note.chunks_added || null,
            dbTotal: note.db_total || null,
    
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            ingestStatus: note.ingest_status || note.ingestStatus || "indexed",
        };
    };
    /***************************************************************************/
    const parseFrameworkMetadata = (metadataText) => {
        if (!metadataText) {
            return {};
        }

        try {
            const parsed = JSON.parse(metadataText);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            console.warn("Could not parse saved framework metadata:", error);
            return {};
        }
    };

    const getFrameworkVersionNumber = (frameworkNote, metadata = {}) => {
        if (Number.isFinite(Number(metadata.version))) {
            return Number(metadata.version);
        }

        const titleMatch = String(frameworkNote.title || "").match(/framework\s+v(\d+)/i);
        return titleMatch ? Number(titleMatch[1]) : 1;
    };

    const convertFrameworkNoteToFramework = (frameworkNote) => {
        const metadata = parseFrameworkMetadata(frameworkNote.userNote);
        const version = getFrameworkVersionNumber(frameworkNote, metadata);

        return {
            id: frameworkNote.id,
            title: frameworkNote.title || `Framework V${version}`,
            version,
            status: "Saved",
            sourceCount: Array.isArray(metadata.sources) ? metadata.sources.length : 0,
            detailLevel: metadata.detailLevel || "detailed",
            sources: Array.isArray(metadata.sources) ? metadata.sources : [],
            direction: metadata.direction || "",
            argument: metadata.argument || "",
            options: metadata.options || {},
            content: frameworkNote.body || "",
            createdAt: frameworkNote.createdAt,
            updatedAt: frameworkNote.updatedAt,
        };
    };

    const sortFrameworkVersions = (frameworks) => {
        return [...frameworks].sort((a, b) => {
            if (b.version !== a.version) {
                return b.version - a.version;
            }

            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
    };

    const escapeHtml = (value) => {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const plainTextToEditorHtml = (value) => {
        return `<pre>${escapeHtml(value)}</pre>`;
    };

    const stripHtml = (value) => {
        return String(value || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/\s+/g, " ")
            .trim();
    };

    const requestAiText = async ({
        question,
        useRag = false,
        sourceFilter = "",
        sourceFilters = [],
        topK = 5,
        signal,
    }) => {
        const cleanSourceFilters = [
            ...new Set(
                (sourceFilters || [])
                    .map((source) => String(source || "").trim())
                    .filter(Boolean)
            ),
        ];

        const data = await apiRequest("/ai/query-text", {
            method: "POST",
            ...(signal ? { signal } : {}),
            body: JSON.stringify({
                question,
                top_k: topK,
                use_rag: useRag,
                source_filters: cleanSourceFilters,
                source_filter: sourceFilter || cleanSourceFilters[0] || "",
                chat_history: [],
                canvas_id: "default",
            }),
        });

        const answer = String(data.answer || "").trim();

        if (!answer) {
            throw new Error("The AI service returned an empty response.");
        }

        return {
            answer,
            sources: Array.isArray(data.sources) ? data.sources : [],
            mode: data.mode,
        };
    };

    const getFrameworkModuleLabels = () => {
        const labels = [];

        if (frameworkOptions.theoryConcepts) labels.push("theory and key concepts");
        if (frameworkOptions.claimsEvidence) labels.push("claims and evidence");
        if (frameworkOptions.caseStudies) labels.push("case studies");
        if (frameworkOptions.researchGaps) labels.push("research gaps");
        if (frameworkOptions.originalContribution) labels.push("original contribution");

        return labels;
    };

    const getLocalSourceContext = (source) => {
        const body = String(source.body || "").trim().slice(0, 4500);
        const userNote = stripHtml(source.userNote || "").slice(0, 3500);
        const contextParts = [];

        if (body) {
            contextParts.push(`SOURCE NOTE / SUMMARY:\n${body}`);
        }

        if (userNote) {
            contextParts.push(`USER ANNOTATIONS:\n${userNote}`);
        }

        return contextParts.join("\n\n");
    };

    /***************************************************************************/
    const convertDatabaseLinkToCanvasLink = (link) => {
        return {
            id: link.id,
            fromNoteId: link.from_note_id,
            toNoteId: link.to_note_id,
        };
    };
    /***************************************************************************/
    const loadLinksFromDatabase = async () => {
        try {
            const data = await apiRequest("/links");

            const databaseLinks = data.links.map(convertDatabaseLinkToCanvasLink);

            setLinks(databaseLinks);
        } catch (error) {
            console.error("Load links error:", error);
        }
    };
    /***************************************************************************/
    const updateNoteInDatabase = async (noteId, updates) => {
        try {
            const data = await apiRequest(`/notes/${noteId}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            });

            return convertDatabaseNoteToCanvasNote(data.note);
        } catch (error) {
            console.error("Update note error:", error);
            console.log("Failed to update note.");
            return null;
        }
    };
    /***************************************************************************/
    const deleteNoteFromDatabase = async (noteId) => {
        try {
            await apiRequest(`/notes/${noteId}`, {
                method: "DELETE",
            });

            return true;
        } catch (error) {
            console.error("Delete note error:", error);
            return false;
        }
    };
    /***************************************************************************/
    const createLinkInDatabase = async (fromNoteId, toNoteId) => {
        try {
            const data = await apiRequest("/links", {
                method: "POST",
                body: JSON.stringify({
                    from_note_id: fromNoteId,
                    to_note_id: toNoteId,
                }),
            });

            return convertDatabaseLinkToCanvasLink(data.link);
        } catch (error) {
            console.error("Create link error:", error);
            return null;
        }
    };
    /***************************************************************************/
    const deleteLinkInDatabase = async (
        linkId
    ) => {
        try {
            await apiRequest(`/links/${linkId}`, {
                method: "DELETE",
            });
    
            return true;
        } catch (error) {
            console.error(
                "Delete link error:",
                error
            );
    
            return false;
        }
    };
    /***************************************************************************/
    const selectedNotes = visibleNotes.filter(
        (note) => note.selected
    );

    const clusterGroups = Object.entries(
        visibleNotes.reduce((groups, note) => {
            if (!note.clusterId) {
                return groups;
            }
    
            if (!groups[note.clusterId]) {
                groups[note.clusterId] = [];
            }
    
            groups[note.clusterId].push(note);
    
            return groups;
        }, {})
    )
        .filter(([, groupNotes]) => groupNotes.length >= 2)
        .sort(([clusterIdA], [clusterIdB]) =>
            clusterIdA.localeCompare(clusterIdB)
        )
        .map(([clusterId, groupNotes], index) => {
            const minX = Math.min(
                ...groupNotes.map((note) => note.x)
            );
    
            const minY = Math.min(
                ...groupNotes.map((note) => note.y)
            );
    
            const maxX = Math.max(
                ...groupNotes.map(
                    (note) => note.x + NOTE_WIDTH
                )
            );
    
            const maxY = Math.max(
                ...groupNotes.map(
                    (note) => note.y + NOTE_HEIGHT
                )
            );
    
            const horizontalPadding = 24;
            const topPadding = 42;
            const bottomPadding = 24;
    
            return {
                id: clusterId,
                label: `Cluster ${index + 1}`,
                noteCount: groupNotes.length,
    
                x: minX - horizontalPadding,
                y: minY - topPadding,
    
                width:
                    maxX -
                    minX +
                    horizontalPadding * 2,
    
                height:
                    maxY -
                    minY +
                    topPadding +
                    bottomPadding,
            };
        });

    const selectedFrameworkSources = selectedNotes.map((note) => ({
        id: note.id,
        title: note.title,
        body: note.body,
        userNote: note.userNote || "",
        sourceName: note.sourceName || note.title,
        noteKind: note.noteKind || note.sourceType || "pdf",
        fileUrl: note.fileUrl || "",
        chunksAdded: note.chunksAdded || null,
    }));

    /***************************************************************************/
    const loadNotesFromDatabase = async () => {
        try {
            const data = await apiRequest("/notes");

            const allDatabaseNotes = data.notes.map(convertDatabaseNoteToCanvasNote);
            const savedFrameworks = sortFrameworkVersions(
                allDatabaseNotes
                    .filter((note) => note.noteKind === "framework")
                    .map(convertFrameworkNoteToFramework)
            );
            const canvasNotes = allDatabaseNotes.filter(
                (note) => note.noteKind !== "framework"
            );

            setNotes(canvasNotes);
            setFrameworkVersions(savedFrameworks);

            const cabinetFiles = canvasNotes
                .filter(
                    (note) =>
                        note.noteKind !== "outline" &&
                        note.noteKind !== "framework" &&
                        (note.fileUrl || note.sourceName)
                )
                .map(convertNoteToCabinetFile);

            setFiles(cabinetFiles);

            if (savedFrameworks.length > 0) {
                const latestFramework = savedFrameworks[0];
                setCurrentFramework(latestFramework);
                setFrameworkEditorDraft(latestFramework.content);
                setFrameworkDirection(latestFramework.direction || "");
                setFrameworkArgument(latestFramework.argument || "");
                setFrameworkDetailLevel(latestFramework.detailLevel || "detailed");
                setFrameworkOptions((prev) => ({
                    ...prev,
                    ...(latestFramework.options || {}),
                }));
                frameworkLastSavedContentRef.current = latestFramework.content;
                setFrameworkSaveStatus("saved");
            }
        } catch (error) {
            console.error("Load notes error:", error);
        }
    };

    const persistCurrentFrameworkImmediately = async () => {
        if (!currentFramework) {
            return true;
        }

        if (!currentFramework.id) {
            setFrameworkSaveStatus("error");
            setFrameworkGenerationError(
                "This framework is not saved yet, so it cannot be safely replaced."
            );
            return false;
        }

        if (frameworkEditorDraft === frameworkLastSavedContentRef.current) {
            return true;
        }

        setFrameworkSaveStatus("saving");

        const contentToSave = frameworkEditorDraft;
        const updatedFrameworkNote = await updateNoteInDatabase(currentFramework.id, {
            body: contentToSave,
        });

        if (!updatedFrameworkNote) {
            setFrameworkSaveStatus("error");
            setFrameworkGenerationError(
                "The latest Framework edits could not be saved."
            );
            return false;
        }

        frameworkLastSavedContentRef.current = contentToSave;
        frameworkLatestDraftRef.current = contentToSave;

        setCurrentFramework((prevFramework) =>
            prevFramework
                ? {
                      ...prevFramework,
                      content: contentToSave,
                      updatedAt: updatedFrameworkNote.updatedAt,
                  }
                : prevFramework
        );

        setFrameworkVersions((prevFrameworks) =>
            prevFrameworks.map((framework) =>
                framework.id === currentFramework.id
                    ? {
                          ...framework,
                          content: contentToSave,
                          updatedAt: updatedFrameworkNote.updatedAt,
                      }
                    : framework
            )
        );

        setFrameworkSaveStatus("saved");
        return true;
    };

    const handleCreateNewFramework = async () => {
        const canContinue = await persistCurrentFrameworkImmediately();

        if (!canContinue) {
            return;
        }

        setFrameworkStep("setup");
        setFrameworkGenerationError("");
        setFrameworkRefinementPrompt("");
        setIsFrameworkExpanded(false);
    };

    const handleSelectFrameworkVersion = async (frameworkId) => {
        const selectedFramework = frameworkVersions.find(
            (framework) => String(framework.id) === String(frameworkId)
        );

        if (!selectedFramework || selectedFramework.id === currentFramework?.id) {
            return;
        }

        const canContinue = await persistCurrentFrameworkImmediately();

        if (!canContinue) {
            return;
        }

        setCurrentFramework(selectedFramework);
        setFrameworkEditorDraft(selectedFramework.content);
        setFrameworkDirection(selectedFramework.direction || "");
        setFrameworkArgument(selectedFramework.argument || "");
        setFrameworkDetailLevel(selectedFramework.detailLevel || "detailed");
        setFrameworkOptions((prev) => ({
            ...prev,
            ...(selectedFramework.options || {}),
        }));
        frameworkLastSavedContentRef.current = selectedFramework.content;
        frameworkLatestDraftRef.current = selectedFramework.content;
        setFrameworkSaveStatus("saved");
        setFrameworkGenerationError("");
        setFrameworkStep("output");
    };

    const handleCancelFrameworkGeneration = () => {
        frameworkGenerationAbortRef.current?.abort();
        frameworkGenerationAbortRef.current = null;
        setFrameworkStep("setup");
    };

    const handleGenerateFramework = async () => {
        if (selectedNotes.length === 0) {
            setFrameworkGenerationError(
                "Select at least one source note before generating a framework."
            );
            return;
        }

        setFrameworkGenerationError("");
        setFrameworkStep("generating");
        setFrameworkSaveStatus("saving");

        const abortController = new AbortController();
        frameworkGenerationAbortRef.current = abortController;

        try {
            const selectedSourceNames = [
                ...new Set(
                    selectedFrameworkSources
                        .map((source) => source.sourceName)
                        .filter(Boolean)
                ),
            ];

            /*
            * Python RAG currently accepts one exact source_filter.
            * With one selected document, filter it strictly.
            * With multiple documents, put every filename into the prompt.
            */
            const sourceFilter =
                selectedSourceNames.length === 1
                    ? selectedSourceNames[0]
                    : "";

            const sourceList = selectedFrameworkSources
                .map(
                    (source, index) =>
                        `${index + 1}. ${source.title}${
                            source.sourceName &&
                            source.sourceName !== source.title
                                ? ` (${source.sourceName})`
                                : ""
                        }`
                )
                .join("\n");

            const localContext = selectedFrameworkSources
                .map((source) => {
                    const context = getLocalSourceContext(source);

                    if (!context) {
                        return "";
                    }

                    return [
                        `SOURCE: ${source.title}`,
                        context,
                    ].join("\n");
                })
                .filter(Boolean)
                .join("\n\n---\n\n");

            const requestedModules = getFrameworkModuleLabels();

            const generationPrompt = `
    You are NEXO, a multidisciplinary academic research assistant.

    Create a rigorous research framework using only the selected source materials.
    The research may concern arts, humanities, engineering, mathematics,
    science, or another academic discipline. Do not assume it is art history.

    SELECTED SOURCES
    ${sourceList}

    RESEARCH DIRECTION
    ${frameworkDirection.trim() || "Infer a focused research question from the selected sources."}

    WORKING ARGUMENT
    ${frameworkArgument.trim() || "Propose a careful working argument supported by the selected sources."}

    DETAIL LEVEL
    ${frameworkDetailLevel}

    REQUIRED MODULES
    ${
        requestedModules.length > 0
            ? requestedModules.map((module) => `- ${module}`).join("\n")
            : "- core concepts\n- claims and evidence\n- research gaps"
    }

    SOURCE-LINKING
    ${
        frameworkOptions.linkClaimsToSources
            ? "Link claims to their supporting source filenames."
            : "Source links are optional."
    }

    AVAILABLE LOCAL NOTE CONTEXT
    ${localContext || "Use the retrieved document chunks from the selected source files."}

    OUTPUT REQUIREMENTS
    - Return clean Markdown only.
    - Do not include a conversational introduction.
    - Begin with "# Research Framework".
    - First identify the likely academic domain of the selected material.
    - Adapt the framework structure to that domain:
        - Engineering / computer science: problem, method, assumptions, system design, evaluation, limitations.
        - Science / physics / chemistry / biology: key concepts, mechanisms, equations, evidence, examples, limitations.
        - Mathematics: definitions, claims, proof strategy, worked examples, assumptions, gaps.
        - Humanities / arts: themes, context, formal analysis, interpretation, evidence, counterarguments.
        - Business / policy: problem, stakeholders, options, risks, implementation, metrics.
    - Include a focused research question or learning question.
    - Include a working argument, hypothesis, or analytical direction.
    - Organize the framework into numbered sections.
    - Connect every major claim to evidence from the selected materials.
    - Use citation IDs such as [S1], [S2], [S3] for evidence.
    - Do not cite sources that were not retrieved.
    - Do not invent quotations, evidence, authors, methods, results, formulas, or page details.
    - Write "NEEDS EVIDENCE" where the selected material is insufficient.
    - If the selected source is homework, quiz, exam, or graded assignment material, do not provide final answers. Build a study framework, concept map, and step-by-step learning plan instead.
    - End with research gaps, study gaps, or recommended next steps.
            `.trim();

            const result = await requestAiText({
                question: generationPrompt,
                useRag: true,
                sourceFilters: selectedSourceNames,
                sourceFilter: selectedSourceNames[0] || "",
                topK: Math.min(
                    10,
                    Math.max(5, selectedFrameworkSources.length * 3)
                ),
                signal: abortController.signal,
            });

            const frameworkText = result.answer
                .replace(/^```(?:markdown)?\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();

            if (!frameworkText) {
                throw new Error(
                    "The AI service returned an empty framework."
                );
            }

            const nextVersion =
                frameworkVersions.reduce(
                    (highestVersion, framework) =>
                        Math.max(
                            highestVersion,
                            Number(framework.version) || 0
                        ),
                    0
                ) + 1;

            const frameworkTitle = `Framework V${nextVersion}`;

            const frameworkSources = selectedFrameworkSources.map(
                (source) => ({
                    id: source.id,
                    title: source.title,
                    sourceName: source.sourceName,
                    noteKind: source.noteKind,
                })
            );

            const frameworkMetadata = {
                version: nextVersion,
                sources: frameworkSources,
                detailLevel: frameworkDetailLevel,
                direction: frameworkDirection.trim(),
                argument: frameworkArgument.trim(),
                options: frameworkOptions,
                generatedAt: new Date().toISOString(),
            };

            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify({
                    title: frameworkTitle,
                    body: frameworkText,

                    // Framework metadata and source links
                    user_note: JSON.stringify(frameworkMetadata),

                    /*
                    * Keep source_type compatible with the existing database.
                    * source_name identifies it as a Framework internally.
                    */
                    source_type: "pdf",
                    source_name: FRAMEWORK_STORAGE_SOURCE,

                    x: 0,
                    y: 0,
                }),
            });

            const savedCanvasNote =
                convertDatabaseNoteToCanvasNote(data.note);

            const savedFramework =
                convertFrameworkNoteToFramework(savedCanvasNote);

            setCurrentFramework(savedFramework);
            setFrameworkEditorDraft(frameworkText);

            setFrameworkVersions((previousFrameworks) =>
                sortFrameworkVersions([
                    savedFramework,
                    ...previousFrameworks.filter(
                        (framework) =>
                            framework.id !== savedFramework.id
                    ),
                ])
            );

            frameworkLastSavedContentRef.current = frameworkText;
            frameworkLatestDraftRef.current = frameworkText;

            setFrameworkSaveStatus("saved");
            setFrameworkStep("output");
        } catch (error) {
            console.error("Generate Framework error:", error);

            if (error.name !== "AbortError") {
                setFrameworkGenerationError(
                    error.message ||
                        "Failed to generate the framework."
                );
            }

            setFrameworkSaveStatus("error");
            setFrameworkStep("setup");
        } finally {
            frameworkGenerationAbortRef.current = null;
        }
    };

    const handleRefineFramework = async () => {
        const instruction = frameworkRefinementPrompt.trim();

        if (!instruction || !currentFramework || !frameworkEditorDraft.trim()) {
            return;
        }

        setIsFrameworkRefining(true);
        setFrameworkGenerationError("");

        try {
            const sourceList = (currentFramework.sources || [])
                .map((source) => `- ${source.title}`)
                .join("\n");
            const refinementPrompt = `
Revise the academic research framework below according to the user's instruction.
Return the entire revised framework in clean Markdown, not just the changed paragraph.
Do not add a conversational preface or code fences.
Preserve accurate source references and do not invent evidence.
If the requested change needs evidence that is not present, mark it NEEDS EVIDENCE.

USER INSTRUCTION
${instruction}

LINKED SOURCES
${sourceList || "No linked-source list is available."}

CURRENT FRAMEWORK
${frameworkEditorDraft.slice(0, 60000)}
            `.trim();

            const data = await requestAiText({
                question: refinementPrompt,
                useRag: false,
            });
            const revisedFramework = data.answer;

            setFrameworkEditorDraft(revisedFramework);
            setFrameworkRefinementPrompt("");
            setFrameworkSaveStatus(currentFramework.id ? "editing" : "error");
        } catch (error) {
            console.error("Refine framework error:", error);
            setFrameworkGenerationError(
                error.message || "Failed to refine the framework."
            );
        } finally {
            setIsFrameworkRefining(false);
        }
    };

    const handleConvertFrameworkToOutline = async () => {
        const rawFramework =
            frameworkEditorDraft ||
            currentFramework?.content ||
            "";

        const frameworkText = stripHtml(
            String(rawFramework)
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        ).trim();

        if (!frameworkText) {
            alert("There is no Framework content to convert.");
            return;
        }

        setIsConvertingOutline(true);
        setFrameworkGenerationError("");

        const outlineTitle = `Outline - ${
            currentFramework?.title || "Framework"
        }`;

        try {
            const prompt = `
    Convert the research framework below into a concise, academically useful research outline.

    Requirements:
    1. Preserve the actual research question, claims, evidence, source relationships, research gaps, and contribution.
    2. Do not copy the complete framework into one section.
    3. Organize information under appropriate outline sections.
    4. Use Roman numerals for main sections.
    5. Use capital letters for subsections.
    6. Use short bullet points for supporting details.
    7. Keep source filenames or citations beside the claims they support.
    8. Do not invent evidence.
    9. Do not use Markdown heading symbols such as # or ##.
    10. Return only the finished outline.

    RESEARCH FRAMEWORK:

    ${frameworkText.slice(0, 50000)}
            `.trim();

            const aiResult = await requestAiText({
                question: prompt,
                useRag: false,
                topK: 5,
            });

            const outlineText = String(aiResult.answer || "")
                .replace(/^#{1,6}\s*/gm, "")
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/^\s*\*\s+/gm, "- ")
                .trim();

            if (!outlineText) {
                throw new Error(
                    "The AI service returned an empty outline."
                );
            }

            const escapeHtml = (value) =>
                value
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

            const outlineHtml = escapeHtml(outlineText)
                .replace(/\n/g, "<br>");

            const stagger = (notes.length % 5) * 24;

            const outlineX =
                (380 - boardOffset.x) / boardScale + stagger;

            const outlineY =
                (150 - boardOffset.y) / boardScale + stagger;

            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify({
                    title: outlineTitle,
                    body: outlineText,
                    user_note: outlineHtml,
                    x: outlineX,
                    y: outlineY,
                    source_type: "pdf",
                    source_name: OUTLINE_STORAGE_SOURCE,
                }),
            });

            const newOutlineNote =
                convertDatabaseNoteToCanvasNote(data.note);

            setNotes((previousNotes) => [
                ...previousNotes,
                newOutlineNote,
            ]);

            const newCabinetFile =
                convertNoteToCabinetFile(newOutlineNote);

            setFiles((prevFiles) => {
                if (temporaryUploadId) {
                    return prevFiles.map((file) =>
                        file.noteId === temporaryUploadId
                            ? {
                                ...newCabinetFile,
                                noteId: newCanvasNote.id,
                            }
                            : file
                    );
                }

                return [newCabinetFile, ...prevFiles];
            });

            setIsFrameworkExpanded(false);
            setIsFrameworkPanelOpen(false);

            handleOpenNote(newOutlineNote);

            alert("AI outline created and opened.");
        } catch (error) {
            console.error("Convert to Outline error:", error);

            setFrameworkGenerationError(
                error.message ||
                "Failed to convert the Framework into an Outline."
            );

            alert(
                error.message ||
                "Failed to create the Outline."
            );
        } finally {
            setIsConvertingOutline(false);
        }
    };
    /***************************************************************************/
    useEffect(() => {
        const editor = expandedFrameworkEditorRef.current;
    
        if (!isFrameworkExpanded || !editor) {
            return;
        }
    
        const nextHtml =
            /<\/?(p|div|br|strong|b|em|i|ul|ol|li|h[1-6]|blockquote|pre)\b/i.test(
                frameworkEditorDraft
            )
                ? frameworkEditorDraft
                : String(frameworkEditorDraft || "")
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\n/g, "<br>");
    
        if (editor.innerHTML !== nextHtml) {
            editor.innerHTML = nextHtml;
        }
    }, [
        isFrameworkExpanded,
        frameworkEditorDraft,
        currentFramework?.id,
    ]);
    /***************************************************************************/
    useEffect(() => {
        loadNotesFromDatabase();
        loadLinksFromDatabase();

        return () => {
            frameworkGenerationAbortRef.current?.abort();

            if (zoomHistoryTimerRef.current) {
                window.clearTimeout(
                    zoomHistoryTimerRef.current
                );
            }
        };
    }, []);
    /***************************************************************************/
    useEffect(() => {
        /*
         * These effects are a Fast Refresh safety net. Normal history
         * writes already update the refs synchronously through the helpers.
         * They also remove a corrupted record left by an older build.
         */
        const cleanUndoStack =
            sanitizeHistoryStack(
                undoStack,
                "Undo"
            );

        undoStackRef.current =
            cleanUndoStack;

        if (
            cleanUndoStack.length !==
            undoStack.length
        ) {
            setUndoStack(cleanUndoStack);
        }
    }, [undoStack]);

    useEffect(() => {
        const cleanRedoStack =
            sanitizeHistoryStack(
                redoStack,
                "Redo"
            );

        redoStackRef.current =
            cleanRedoStack;

        if (
            cleanRedoStack.length !==
            redoStack.length
        ) {
            setRedoStack(cleanRedoStack);
        }
    }, [redoStack]);
    /***************************************************************************/
    useEffect(() => {
        frameworkLatestDraftRef.current = frameworkEditorDraft;

        if (
            frameworkStep !== "output" ||
            !currentFramework?.id ||
            frameworkEditorDraft === frameworkLastSavedContentRef.current
        ) {
            return;
        }

        setFrameworkSaveStatus("editing");

        const frameworkId = currentFramework.id;
        const contentToSave = frameworkEditorDraft;

        const saveTimer = window.setTimeout(async () => {
            setFrameworkSaveStatus("saving");

            const updatedFrameworkNote = await updateNoteInDatabase(frameworkId, {
                body: contentToSave,
            });

            if (!updatedFrameworkNote) {
                setFrameworkSaveStatus("error");
                return;
            }

            frameworkLastSavedContentRef.current = contentToSave;

            setCurrentFramework((prevFramework) =>
                prevFramework?.id === frameworkId
                    ? {
                          ...prevFramework,
                          content: contentToSave,
                          updatedAt: updatedFrameworkNote.updatedAt,
                      }
                    : prevFramework
            );

            setFrameworkVersions((prevFrameworks) =>
                prevFrameworks.map((framework) =>
                    framework.id === frameworkId
                        ? {
                              ...framework,
                              content: contentToSave,
                              updatedAt: updatedFrameworkNote.updatedAt,
                          }
                        : framework
                )
            );

            setFrameworkSaveStatus(
                frameworkLatestDraftRef.current === contentToSave
                    ? "saved"
                    : "editing"
            );
        }, 900);

        return () => window.clearTimeout(saveTimer);
    }, [frameworkEditorDraft, currentFramework?.id, frameworkStep]);
    /***************************************************************************/
    useEffect(() => {
        if (openedNote && editorRef.current) {
            editorRef.current.innerHTML = openedNote.userNote || "";
            setNoteDraft(openedNote.userNote || "");
        }
    }, [openedNoteId]);
    /***************************************************************************/
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [chatMessages, isAiThinking]);
    /***************************************************************************/
    /** When click "Delete" or "Backspace" it will delete the selected note */
    useEffect(() => {
        const handleKeyDown = (event) => {
            const target = event.target;

            const isTyping =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;

            if (isTyping) {
                return;
            }

            if (openedNote) {
                return;
            }

            if (event.key === "Delete" || event.key === "Backspace") {
                handleDeleteSelectedNote();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [notes, links, openedNote]);

    const handleUndo = async () => {
        /*
         * A ref lock is required here. React state does not change
         * synchronously, so two very fast clicks can both observe
         * isRestoringHistory === false and start two restorations.
         */
        if (
            historyBusyRef.current ||
            dragSaveInProgressRef.current
        ) {
            return;
        }

        const cleanUndoStack =
            sanitizeHistoryStack(
                undoStackRef.current,
                "Undo"
            );

        if (
            cleanUndoStack.length !==
            undoStackRef.current.length
        ) {
            replaceUndoStack(cleanUndoStack);
        }

        const previousSnapshot =
            cleanUndoStack.at(-1);

        if (!previousSnapshot) {
            return;
        }

        const currentSnapshot =
            cloneSnapshot(getSnapshot());

        if (!currentSnapshot) {
            return;
        }

        historyBusyRef.current = true;
        setIsRestoringHistory(true);
        endZoomHistoryGesture();

        try {
            const restored =
                await restoreSnapshot(
                    previousSnapshot
                );

            if (!restored) {
                return;
            }

            replaceUndoStack(
                cleanUndoStack.slice(0, -1)
            );

            replaceRedoStack([
                ...redoStackRef.current,
                currentSnapshot,
            ]);
        } finally {
            historyBusyRef.current = false;
            setIsRestoringHistory(false);
        }
    };

    const handleRedo = async () => {
        if (
            historyBusyRef.current ||
            dragSaveInProgressRef.current
        ) {
            return;
        }

        const cleanRedoStack =
            sanitizeHistoryStack(
                redoStackRef.current,
                "Redo"
            );

        if (
            cleanRedoStack.length !==
            redoStackRef.current.length
        ) {
            replaceRedoStack(cleanRedoStack);
        }

        const nextSnapshot =
            cleanRedoStack.at(-1);

        if (!nextSnapshot) {
            return;
        }

        const currentSnapshot =
            cloneSnapshot(getSnapshot());

        if (!currentSnapshot) {
            return;
        }

        historyBusyRef.current = true;
        setIsRestoringHistory(true);
        endZoomHistoryGesture();

        try {
            const restored =
                await restoreSnapshot(
                    nextSnapshot
                );

            if (!restored) {
                return;
            }

            replaceRedoStack(
                cleanRedoStack.slice(0, -1)
            );

            replaceUndoStack([
                ...undoStackRef.current,
                currentSnapshot,
            ]);
        } finally {
            historyBusyRef.current = false;
            setIsRestoringHistory(false);
        }
    };

    const handleSelectTool = () => {
        console.log("Select tool clicked");
    };

    const handlePanTool = () => {
        console.log("Pan tool clicked");
    };

    const handleCreateBlankNote = async () => {
        const newNoteData = {
            title: "New Note",
            body: "Write your source text or idea here.",
            user_note: "",
            x: 320 + notes.length * 25,
            y: 140 + notes.length * 25,
            source_type: "note",
        };

        const before = getSnapshot();

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);
            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);
            pushUndoSnapshot(before);
        } catch (error) {
            console.error("Create blank note error:", error);
            alert("Failed to create note.");
        }
    };

    const handleCluster = async () => {
        const selected = notes.filter(
            (note) => note.selected
        );
    
        if (selected.length === 0) {
            alert("Select at least one note.");
            return;
        }
    
        const selectedClusterId =
            selected[0].clusterId;
    
        const selectedAreSameCluster =
            Boolean(selectedClusterId) &&
            selected.every(
                (note) =>
                    note.clusterId === selectedClusterId
            );
    
        const shouldUncluster =
            selectedAreSameCluster;
    
        if (!shouldUncluster && selected.length < 2) {
            alert(
                "Select at least two notes to create a cluster."
            );
            return;
        }
    
        /*
          Selecting any note from an existing Cluster and
          clicking Cluster again removes the entire Cluster.
        */
        const targetNotes = shouldUncluster
            ? notes.filter(
                  (note) =>
                      note.clusterId === selectedClusterId
              )
            : selected;
    
        if (
            targetNotes.some((note) => note.locked)
        ) {
            alert(
                "Unlock all notes before changing their cluster."
            );
            return;
        }
    
        const before = getSnapshot();
    
        const generatedClusterId =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `cluster-${Date.now()}-${Math.random()
                      .toString(16)
                      .slice(2)}`;
    
        const nextClusterId = shouldUncluster
            ? null
            : generatedClusterId;
    
        const positionMap = new Map();
    
        /*
          Creating a Cluster also arranges its Notes
          into a compact grid.
        */
        if (!shouldUncluster) {
            const anchorX = Math.min(
                ...targetNotes.map((note) => note.x)
            );
    
            const anchorY = Math.min(
                ...targetNotes.map((note) => note.y)
            );
    
            const columns = Math.ceil(
                Math.sqrt(targetNotes.length)
            );
    
            const horizontalGap = 28;
            const verticalGap = 28;
    
            targetNotes.forEach((note, index) => {
                const column = index % columns;
                const row = Math.floor(index / columns);
    
                positionMap.set(note.id, {
                    x:
                        anchorX +
                        column *
                            (NOTE_WIDTH + horizontalGap),
    
                    y:
                        anchorY +
                        row *
                            (NOTE_HEIGHT + verticalGap),
                });
            });
        }
    
        const updateResults = await Promise.all(
            targetNotes.map((note) => {
                const nextPosition =
                    positionMap.get(note.id);
    
                return updateNoteInDatabase(note.id, {
                    cluster_id: nextClusterId,
    
                    ...(nextPosition
                        ? {
                              x: nextPosition.x,
                              y: nextPosition.y,
                          }
                        : {}),
                });
            })
        );
    
        const failed = updateResults.some(
            (result) => !result
        );
    
        if (failed) {
            await loadNotesFromDatabase();
    
            alert(
                "Some notes could not be clustered."
            );
    
            return;
        }
    
        const targetIds = new Set(
            targetNotes.map((note) => note.id)
        );
    
        setNotes((prevNotes) =>
            prevNotes.map((note) => {
                if (!targetIds.has(note.id)) {
                    return note;
                }
    
                const nextPosition =
                    positionMap.get(note.id);
    
                return {
                    ...note,
                    clusterId: nextClusterId,
    
                    ...(nextPosition
                        ? {
                              x: nextPosition.x,
                              y: nextPosition.y,
                          }
                        : {}),
                };
            })
        );
    
        pushUndoSnapshot(before);
    };

    const handleAutoArrange = async () => {
        const before = getSnapshot();
    
        const layoutUnits = [];
        const handledClusterIds = new Set();
    
        notes.forEach((note) => {
            if (note.locked) {
                return;
            }
    
            if (!note.clusterId) {
                layoutUnits.push([note]);
                return;
            }
    
            if (
                handledClusterIds.has(
                    note.clusterId
                )
            ) {
                return;
            }
    
            const clusterMembers = notes.filter(
                (candidate) =>
                    candidate.clusterId ===
                    note.clusterId
            );
    
            handledClusterIds.add(
                note.clusterId
            );
    
            /*
              If one member is locked, the whole Cluster
              remains in its current position.
            */
            if (
                clusterMembers.some(
                    (candidate) =>
                        candidate.locked
                )
            ) {
                return;
            }
    
            layoutUnits.push(clusterMembers);
        });
    
        if (layoutUnits.length === 0) {
            alert(
                "There are no movable notes."
            );
            return;
        }
    
        const positionMap = new Map();
    
        const unitColumnCount = 3;
        const unitHorizontalSpace = 520;
        const unitVerticalSpace = 360;
    
        layoutUnits.forEach(
            (unitNotes, unitIndex) => {
                const unitX =
                    280 +
                    (unitIndex %
                        unitColumnCount) *
                        unitHorizontalSpace;
    
                const unitY =
                    120 +
                    Math.floor(
                        unitIndex /
                            unitColumnCount
                    ) *
                        unitVerticalSpace;
    
                if (unitNotes.length === 1) {
                    positionMap.set(
                        unitNotes[0].id,
                        {
                            x: unitX,
                            y: unitY,
                        }
                    );
    
                    return;
                }
    
                const columns = Math.ceil(
                    Math.sqrt(
                        unitNotes.length
                    )
                );
    
                unitNotes.forEach(
                    (note, noteIndex) => {
                        const column =
                            noteIndex % columns;
    
                        const row = Math.floor(
                            noteIndex / columns
                        );
    
                        positionMap.set(note.id, {
                            x:
                                unitX +
                                column *
                                    (NOTE_WIDTH +
                                        28),
    
                            y:
                                unitY +
                                row *
                                    (NOTE_HEIGHT +
                                        28),
                        });
                    }
                );
            }
        );
    
        const updatedNotes = notes.map(
            (note) => {
                const nextPosition =
                    positionMap.get(note.id);
    
                if (!nextPosition) {
                    return note;
                }
    
                return {
                    ...note,
                    ...nextPosition,
                };
            }
        );
    
        setNotes(updatedNotes);
    
        const updateResults =
            await Promise.all(
                Array.from(
                    positionMap.entries()
                ).map(
                    ([
                        noteId,
                        nextPosition,
                    ]) =>
                        updateNoteInDatabase(
                            noteId,
                            nextPosition
                        )
                )
            );
    
        const failed = updateResults.some(
            (result) => !result
        );
    
        if (failed) {
            await loadNotesFromDatabase();
    
            alert(
                "Some note positions could not be saved."
            );
    
            return;
        }
    
        pushUndoSnapshot(before);
    };

    const handleLockSelected = async () => {
        const selected = notes.filter(
            (note) => note.selected
        );
    
        if (selected.length === 0) {
            alert("Select at least one note.");
            return;
        }
    
        // 保存 Lock / Unlock 之前的完整状态
        const before = getSnapshot();
    
        /*
          如果选中的 Note 全部已经 Locked：
          点击后执行 Unlock。
    
          只要有一个未 Locked：
          点击后全部执行 Lock。
        */
        const nextLockedState = !selected.every(
            (note) => note.locked
        );
    
        const updateResults = await Promise.all(
            selected.map(async (note) => {
                const updatedNote =
                    await updateNoteInDatabase(note.id, {
                        is_locked: nextLockedState,
                    });
    
                return {
                    noteId: note.id,
                    updatedNote,
                };
            })
        );
    
        const successfulIds = new Set(
            updateResults
                .filter((result) =>
                    Boolean(result.updatedNote)
                )
                .map((result) => result.noteId)
        );
    
        if (successfulIds.size === 0) {
            alert(
                nextLockedState
                    ? "Failed to lock the selected notes."
                    : "Failed to unlock the selected notes."
            );
            return;
        }
    
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                successfulIds.has(note.id)
                    ? {
                          ...note,
                          locked: nextLockedState,
                      }
                    : note
            )
        );
    
        // 加入 Undo history，并在同一个 helper 中清空 Redo。
        pushUndoSnapshot(before);
    
        if (successfulIds.size !== selected.length) {
            alert(
                "Some selected notes could not be updated."
            );
        }
    };

    const handlePinTop = async () => {
        const selected = notes.filter(
            (note) => note.selected
        );
    
        if (selected.length === 0) {
            alert("Select at least one note.");
            return;
        }
    
        // 保存 Pin / Unpin 之前的完整状态
        const before = getSnapshot();
    
        /*
          如果选中的 Note 全部已经 Pinned：
          点击后执行 Unpin。
    
          只要有一个未 Pinned：
          点击后全部执行 Pin Top。
        */
        const nextPinnedState = !selected.every(
            (note) => note.pinned
        );
    
        const updateResults = await Promise.all(
            selected.map(async (note) => {
                const updatedNote =
                    await updateNoteInDatabase(note.id, {
                        is_pinned: nextPinnedState,
                    });
    
                return {
                    noteId: note.id,
                    updatedNote,
                };
            })
        );
    
        const successfulIds = new Set(
            updateResults
                .filter((result) =>
                    Boolean(result.updatedNote)
                )
                .map((result) => result.noteId)
        );
    
        if (successfulIds.size === 0) {
            alert(
                nextPinnedState
                    ? "Failed to pin the selected notes."
                    : "Failed to unpin the selected notes."
            );
            return;
        }
    
        setNotes((prevNotes) =>
            prevNotes.map((note) =>
                successfulIds.has(note.id)
                    ? {
                          ...note,
                          pinned: nextPinnedState,
                      }
                    : note
            )
        );
    
        // 加入 Undo history，并在同一个 helper 中清空 Redo。
        pushUndoSnapshot(before);
    
        if (successfulIds.size !== selected.length) {
            alert(
                "Some selected notes could not be updated."
            );
        }
    };

    const handleSearchSources = (keyword) => {
        setSourceSearchQuery(
            String(keyword ?? "")
        );
    
        // Prevent a preview belonging to a hidden Note
        // from remaining on the Canvas.
        setHoveredNoteId(null);
    };

    const handlePrepareAiToolPrompt = (promptText) => {
        setChatInput(promptText);
        setIsChatOpen(true);
    };

    const handleAskOnly = () => {
        handlePrepareAiToolPrompt("Answer only based on the selected sources. ");
    };

    const handleSummary = () => {
        handlePrepareAiToolPrompt("Summarize the selected sources clearly. Include the main idea, key arguments, important evidence, and possible research value.");
    };

    const handleCompare = () => {
        handlePrepareAiToolPrompt("Compare the selected sources. Explain their similarities, differences, tensions, and how they could be used together in research.");
    };

    const handleFindEvidence = () => {
        handlePrepareAiToolPrompt("Find evidence from the selected sources for a possible research argument. Include the source name and why each piece of evidence matters.");
    };

    const handleFindGaps = () => {
        handlePrepareAiToolPrompt("Find research gaps in the selected sources. What is missing, unclear, contradictory, or worth further investigation?");
    };

    const handleOutline = () => {
        handlePrepareAiToolPrompt("Generate a research outline based on the selected sources. Include a possible thesis, sections, evidence, and conclusion.");
    };

    const handleSaveProject = () => {
        alert("Saved.");
    };

    const handleExportProject = () => {
        alert("Export will be added later.");
    };

    const handleShareProject = () => {
        alert("Share will be added later.");
    };

    const handleOpenSettings = () => {
        alert("Settings will be added later.");
    };
    /***************************************************************************/
    return (
        <div className="Canvas_Page">
            <Header
                activeToolMode={activeToolMode}
                setActiveToolMode={setActiveToolMode}

                projectName="NEXO"
                projectSubtitle="Photography and Evidence"
                saveStatus="Saved"

                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                isHistoryBusy={isRestoringHistory}
                onSelectTool={handleSelectTool}
                onDeleteSelected={handleDeleteSelectedNote}
                onPanTool={handlePanTool}
                onCreateNote={handleCreateBlankNote}
                onLinkSelected={handleLinkSelectedNotes}
                onUpload={() => setShowUploadModal(true)}
                onCluster={handleCluster}
                onAutoArrange={handleAutoArrange}
                onLockSelected={handleLockSelected}
                onPinTop={handlePinTop}

                sourceSearchQuery={sourceSearchQuery}

                onSearchSources={handleSearchSources}
                onAskOnly={handleAskOnly}
                onSummary={handleSummary}
                onCompare={handleCompare}
                onFindEvidence={handleFindEvidence}
                onFindGaps={handleFindGaps}
                onFramework={() => {
                    setIsFrameworkPanelOpen(true);
                    setFrameworkStep(currentFramework ? "output" : "setup");
                    setFrameworkGenerationError("");
                    setIsChatOpen(true);
                }}
                onOutline={handleOutline}

                onSave={handleSaveProject}
                onExport={handleExportProject}
                onShare={handleShareProject}
                onSettings={handleOpenSettings}
            />
            <main className="Canvas_Main">
                <button className="Logout_Button" onClick={handleLogout}>Logout {currentUser?.email ? `(${currentUser.email})` : ""}</button>
                <button className="Database_Button" onClick={() => setShowDatabaseSearch(true)}>
                    Open Database Search
                </button>

                <aside className={`Canvas_Left ${isCabinetOpen ? "Canvas_Left_Open" : "Canvas_Left_Closed"}`}>
                    <button className="Cabinet_Toggle_Button" onClick={() => setIsCabinetOpen((prev) => !prev)}>{isCabinetOpen ? <AiOutlineDoubleLeft className="DoubleLeft" /> : <AiOutlineDoubleRight className="DoubleRight"/>}</button>
                    {isCabinetOpen && (
                        <>
                            <div className="Cabinet_Header">
                                <h2>CABINTE</h2>
                                <button className="Cabinet_Add_Button" onClick={()=>setShowUploadModal(true)}>+</button>
                            </div>

                            <div className="Cabinet_File_List">

                                {files.map((file) => (
                                    <div className="Cabinet_File_Row" key={file.id} draggable onClick={() => handleFileClick(file)} onDragStart={(event) => handleFileDragStart(event, file)}>
                                        <div className="Cabinet_File_Icon">📑</div>
                                        <div className="Cabinet_File_Info">
                                            <p className="Cabinet_File_Title">{file.title}</p>
                                            <div className="Cabinet_File_Meta">
                                                <span>{file.date}</span>
                                                <span className="Cabinet_File_Size">{file.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    

                </aside>
                
                <section className="Canvas_Center" style={{backgroundPosition: `${boardOffset.x}px ${boardOffset.y}px` , backgroundSize: `${14 * boardScale}px ${14 * boardScale}px`}} onMouseDown={handleBoardMouseDown} onWheel={handleCanvasWheel} onDragOver={handleCanvasDragOver} onDrop={handleCanvasDrop} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}>
                    
                    <div className="Canvas_World" style={{transform: `translate(${boardOffset.x}px, ${boardOffset.y}px) scale(${boardScale})`,}}>
                        
                        {clusterGroups.map((cluster) => (
                            <div
                                key={cluster.id}
                                className="Canvas_Cluster_Box"
                                style={{
                                    left: `${cluster.x}px`,
                                    top: `${cluster.y}px`,
                                    width: `${cluster.width}px`,
                                    height: `${cluster.height}px`,
                                }}
                            >
                                <span className="Canvas_Cluster_Label">
                                    {cluster.label} ·{" "}
                                    {cluster.noteCount} notes
                                </span>
                            </div>
                        ))}
                        
                        <svg className="Canvas_Link_Layer">
                            {visibleLinks.map((link) => {
                                const fromNote = getNoteById(link.fromNoteId);
                                const toNote = getNoteById(link.toNoteId);

                                if (!fromNote || !toNote) {
                                    return null;
                                }

                                const x1 = fromNote.x + NOTE_WIDTH / 2;
                                const y1 = fromNote.y + NOTE_HEIGHT / 2;
                                const x2 = toNote.x + NOTE_WIDTH / 2;
                                const y2 = toNote.y + NOTE_HEIGHT / 2;

                                return (
                                    <line key={link.id} x1={x1} y1={y1} x2={x2} y2={y2} className="Canvas_Link_Line" />
                                );
                            })}
                        </svg>

                        {visibleNotes.map((note) => (
                            <div
                                className={[
                                    "Canvas_Note_Card",
                                    note.selected
                                        ? "Canvas_Note_Selected"
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                key={note.id}
                                onMouseEnter={() =>
                                    setHoveredNoteId(note.id)
                                }
                                onMouseLeave={() =>
                                    setHoveredNoteId(null)
                                }
                                onClick={() => {
                                    if (!hasDraggedNote) {
                                        handleNoteClick(note.id);
                                    }
                                }}
                                onMouseDown={(event) =>
                                    handleNoteMouseDown(event, note)
                                }
                                style={{
                                    left: `${note.x}px`,
                                    top: `${note.y}px`,

                                    // Pinned notes appear above normal notes.
                                    zIndex: note.pinned ? 5 : 2,

                                    // Locked notes cannot be dragged.
                                    cursor: note.locked
                                        ? "not-allowed"
                                        : "grab",

                                    // Simple visual indication for locked notes.
                                    borderStyle: note.locked
                                        ? "dashed"
                                        : "solid",

                                    // Simple visual indication for pinned notes.
                                    boxShadow: note.pinned
                                        ? "0 0 0 2px rgba(30, 30, 30, 0.65), 0 8px 20px rgba(0, 0, 0, 0.20)"
                                        : undefined,
                                }}
                            >
                                {(note.locked || note.pinned) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "6px",
                                            right: "8px",
                                            display: "flex",
                                            gap: "4px",
                                            fontSize: "11px",
                                            zIndex: 2,
                                        }}
                                    >
                                        {note.locked && (
                                            <span title="Locked">🔒</span>
                                        )}

                                        {note.pinned && (
                                            <span title="Pinned to top">
                                                📌
                                            </span>
                                        )}
                                    </div>
                                )}

                                <p
                                    className="Canvas_Note_Title"
                                    title={note.title}
                                >
                                    {note.title}
                                </p>

                                <p className="Canvas_Note_Body">
                                    {note.body.length > 90
                                        ? `${note.body.slice(0, 90)}...`
                                        : note.body}
                                </p>

                                <p className="Canvas_Note_Meta">
                                    {getCanvasNoteTypeLabel(note.sourceType)}
                                    {note.ingestStatus && (
                                        <span className={`Canvas_Note_Status Status_${note.ingestStatus}`}>
                                            {note.ingestStatus}
                                        </span>
                                    )}
                                </p>

                                <div className="Canvas_Note_Dot"></div>
                            </div>
                        ))}

                        {hoveredNote && (
                            <div className="Note_Preview_Card" style={{left: `${hoveredNote.x + NOTE_WIDTH + 8}px`, top: `${hoveredNote.y}px`}} onMouseEnter={() => setHoveredNoteId(hoveredNote.id)} onMouseLeave={() => setHoveredNoteId(null)}>
                                <p className="Note_Preview_Label">
                                    {hoveredNote.noteKind === "outline" ? "OUTLINE" : "PAPER"}
                                </p>
                                <h3 title={hoveredNote.title}>
                                    {hoveredNote.title}
                                </h3>
                                <p className="Note_Preview_Label">ABSTRACT</p>
                                <p
                                    className="Note_Preview_Text"
                                    title={stripHtml(hoveredNote.body || "")}
                                >
                                    {stripHtml(hoveredNote.body || "").length > 200
                                        ? `${stripHtml(hoveredNote.body || "").slice(0, 199)}…`
                                        : stripHtml(hoveredNote.body || "") ||
                                        "No abstract available."}
                                </p>
                                <p className="Note_Preview_Label">CONNECTIONS</p>
                                <p className="Note_Preview_Number">
                                    {
                                        visibleLinks.filter(
                                            (link) => link.fromNoteId === hoveredNote.id || link.toNoteId === hoveredNote.id
                                        ).length
                                    }
                                </p>

                                <button className="Note_Preview_Button" onClick={() => handleOpenNote(hoveredNote)}>
                                    OPEN NOTE
                                </button>
                            </div>
                        )}

                    </div>
                    
                    <div className="Canvas_Bottom_Toolbar">
                        <span className="Canvas_Toolbar_Selected_Text">{selectedNotesCount} notes selected</span>
                        
                        {isSourceSearchActive && (
                            <span className="Canvas_Link_Count_Text">
                                {visibleNotes.length} result
                                {visibleNotes.length === 1 ? "" : "s"}
                            </span>
                        )}

                        <span className="Canvas_Zoom_Text">{zoomPercentage}%</span>
                        <span className="Canvas_Link_Count_Text">{visibleLinks.length} links</span>
                        <button className="Canvas_Toolbar_Button" onClick={handleResetView}><FaHome /></button>
                        <button className="Canvas_Toolbar_Button" onClick={handleLinkSelectedNotes}><FaLink /></button>
                        <button className="Canvas_Toolbar_Button"><TfiAlignJustify /></button>
                    </div>

                </section>

                <aside className={`Canvas_Right ${isChatOpen ? "Canvas_Right_Open" : "Canvas_Right_Closed"}`}>
                    <button
                        className="Chat_Toggle_Button"
                        onClick={() => setIsChatOpen((prev) => !prev)}
                    >
                        {isChatOpen ? (
                            <AiOutlineDoubleRight className="DoubleLeft" />
                        ) : (
                            <AiOutlineDoubleLeft className="DoubleRight" />
                        )}
                    </button>

                    {isChatOpen && (
                        <>
                            {isFrameworkPanelOpen ? (
                                <FrameworkPanel
                                    step={frameworkStep}
                                    selectedNotes={selectedNotes}
                                    frameworkDirection={frameworkDirection}
                                    setFrameworkDirection={setFrameworkDirection}
                                    frameworkArgument={frameworkArgument}
                                    setFrameworkArgument={setFrameworkArgument}
                                    frameworkDetailLevel={frameworkDetailLevel}
                                    setFrameworkDetailLevel={setFrameworkDetailLevel}
                                    frameworkOptions={frameworkOptions}
                                    setFrameworkOptions={setFrameworkOptions}
                                    currentFramework={currentFramework}
                                    frameworkVersions={frameworkVersions}
                                    frameworkEditorDraft={frameworkEditorDraft}
                                    setFrameworkEditorDraft={setFrameworkEditorDraft}
                                    frameworkSaveStatus={frameworkSaveStatus}
                                    generationError={frameworkGenerationError}
                                    refinementPrompt={frameworkRefinementPrompt}
                                    setRefinementPrompt={setFrameworkRefinementPrompt}
                                    isRefining={isFrameworkRefining}
                                    isConvertingOutline={isConvertingOutline}
                                    onGenerate={handleGenerateFramework}
                                    onCancelGeneration={handleCancelFrameworkGeneration}
                                    onCreateNew={handleCreateNewFramework}
                                    onSelectVersion={handleSelectFrameworkVersion}
                                    onRefine={handleRefineFramework}
                                    onClose={() => setIsFrameworkPanelOpen(false)}
                                    onExpand={() => setIsFrameworkExpanded(true)}
                                    onConvertToOutline={handleConvertFrameworkToOutline}
                                />
                            ) : (
                                <>
                                    <div className="Chat_Header">
                                        <h2>Start Chatting</h2>
                                    </div>

                                    <div className="Chat_Body">
                                        {chatMessages.length === 0 ? (
                                            selectedNotesCount === 0 ? (
                                                <p className="Chat_Empty_Text">
                                                    Ask a general question, or select a note to ask based on sources.
                                                </p>
                                            ) : (
                                                <div className="Chat_Active_State">
                                                    <p className="Chat_Context_Text">
                                                        AI will answer based on {selectedNotesCount} selected note(s).
                                                    </p>

                                                    <div className="Chat_Message Chat_Message_AI">
                                                        Ask a grounded question about the selected source notes.
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className="Chat_Message_List">
                                                {chatMessages.map((message) => (
                                                    <div
                                                        className={`Chat_Message_Row ${
                                                            message.role === "user"
                                                                ? "Chat_Message_Row_User"
                                                                : "Chat_Message_Row_AI"
                                                        }`}
                                                        key={message.id}
                                                    >
                                                        <div className="Chat_Message_Label">
                                                            {message.role === "user" ? "User" : "AI"}
                                                        </div>

                                                        <div
                                                            className={`Chat_Message ${
                                                                message.role === "user"
                                                                    ? "Chat_Message_User"
                                                                    : "Chat_Message_AI"
                                                            }`}
                                                        >
                                                            {message.role === "ai" ? (
                                                                <div className="Chat_Message_Text">
                                                                    {renderAiMarkdown(message.text, message.sources || [])}
                                                                </div>
                                                            ) : (
                                                                <div className="Chat_Message_Text">
                                                                    {message.text}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {isAiThinking && (
                                                    <div className="Chat_Message_Row Chat_Message_Row_AI">
                                                        <div className="Chat_Message_Label">AI</div>
                                                        <div className="Chat_Message Chat_Message_AI">
                                                            AI is thinking...
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div ref={chatBottomRef} />
                                            </div>
                                        )}
                                    </div>
                                    {activeCitationSource && (
                                        <div className="Citation_Preview_Card">
                                            <div className="Citation_Preview_Header">
                                                <div>
                                                    <p>Source Evidence</p>
                                                    <h3>{activeCitationSource.file || "Source"}</h3>
                                                    <span>Chunk {activeCitationSource.chunk || ""}</span>
                                                    <span className="Citation_Preview_Note">
                                                        Extracted text preview
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setActiveCitationSource(null)}
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <div className="Citation_Preview_Body">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                >
                                                    {activeCitationSource.text || activeCitationSource.preview || "No preview available."}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    <div className="Chat_Input_Bar">
                                        <input
                                            className="Chat_Input"
                                            placeholder={
                                                selectedNotesCount > 0
                                                    ? "Ask about selected notes..."
                                                    : "Ask a general question..."
                                            }
                                            value={chatInput}
                                            onChange={(event) => setChatInput(event.target.value)}
                                            onKeyDown={handleChatKeyDown}
                                            disabled={isAiThinking}
                                        />

                                        <button
                                            className="Chat_Send_Button"
                                            onClick={handleSendMessage}
                                            disabled={isAiThinking || !chatInput.trim()}
                                        >
                                            <VscArrowUp />
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </aside>
            </main>
            <UploadFile showModal={showUploadModal} onClose={() => setShowUploadModal(false)} onUploadSuccess={handleUploadSuccess}/>
            <DatabaseSearch showModal={showDatabaseSearch} onClose={() => setShowDatabaseSearch(false)} onSendToBoard={handleSendDocToBoard}/>
            {openedNote && (
                <div className="Note_Modal_Overlay">
                    <div className="Note_Modal">
                        <div className="Note_Modal_Header">
                            <div>
                                <h2>{openedNote.title}</h2>
                                <p>Created</p>
                                <p>2026.5.6</p>
                            </div>

                            <button className="Note_Modal_Close_Button" onClick={handleCloseNote}>
                                ×
                            </button>
                        </div>

                        <div className="Note_Modal_Body">
                            <div className="Note_Source_Column">
                                <p className="Note_Modal_Label">SOURCE TEXT</p>

                                <div className="Note_Source_Content">
                                    {openedNote.sourceType ===
                                        "pdf" &&
                                    openedNote.fileUrl ? (
                                        <div className="Note_PDF_Preview">
                                            <iframe
                                                src={
                                                    openedNote.fileUrl
                                                }
                                                title={
                                                    openedNote.title
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="Note_Source_Text">
                                                {openedNote.body ||
                                                    "No source preview available."}
                                            </p>

                                            {openedNote.fileUrl && (
                                                <a
                                                    href={
                                                        openedNote.fileUrl
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Open original{" "}
                                                    {getCanvasNoteTypeLabel(
                                                        openedNote.noteKind
                                                    )}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                
                            </div>

                            <div className="Note_User_Column">
                                <div className="Note_Editor">
                                    <div className="Note_Editor_Header">
                                        <input className="Note_Editor_Title_Input" value={openedNote.title} readOnly/>

                                        <button
                                            type="button"
                                            className="Note_Editor_Delete_Button"
                                            onClick={handleDeleteOpenedNote}
                                            aria-label="Delete note"
                                            title="Delete note"
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>

                                    <div className="Note_Editor_Toolbar">
                                        <button
                                            type="button"
                                            aria-label="Undo note edit"
                                            title="Undo (Command/Ctrl + Z)"
                                            onMouseDown={(event) =>
                                                handleNoteEditorHistory(
                                                    event,
                                                    "undo"
                                                )
                                            }
                                        >
                                            <TiArrowBack />
                                        </button>

                                        <button
                                            type="button"
                                            aria-label="Redo note edit"
                                            title="Redo (Command/Ctrl + Shift + Z)"
                                            onMouseDown={(event) =>
                                                handleNoteEditorHistory(
                                                    event,
                                                    "redo"
                                                )
                                            }
                                        >
                                            <TiArrowForward />
                                        </button>

                                        <select
                                            defaultValue="p"
                                            aria-label="Text style"
                                            onChange={(event) =>
                                                handleEditorCommand(
                                                    "formatBlock",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="p">Normal</option>
                                            <option value="h1">Heading 1</option>
                                            <option value="h2">Heading 2</option>
                                            <option value="blockquote">
                                                Quote
                                            </option>
                                        </select>

                                        <button
                                            type="button"
                                            title="Bold"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "bold"
                                                )
                                            }
                                        >
                                            <b>B</b>
                                        </button>

                                        <button
                                            type="button"
                                            title="Italic"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "italic"
                                                )
                                            }
                                        >
                                            <i>I</i>
                                        </button>

                                        <button
                                            type="button"
                                            title="Underline"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "underline"
                                                )
                                            }
                                        >
                                            <u>U</u>
                                        </button>

                                        <button
                                            type="button"
                                            title="Add link"
                                            onMouseDown={(event) => {
                                                event.preventDefault();

                                                const url = window.prompt(
                                                    "Enter link URL:"
                                                );

                                                if (url?.trim()) {
                                                    handleEditorCommand(
                                                        "createLink",
                                                        url.trim()
                                                    );
                                                }
                                            }}
                                        >
                                            <IoLinkSharp />
                                        </button>

                                        <button
                                            type="button"
                                            title="Code block"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "formatBlock",
                                                    "pre"
                                                )
                                            }
                                        >
                                            &lt;&gt;
                                        </button>

                                        <button
                                            type="button"
                                            title="Bulleted list"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "insertUnorderedList"
                                                )
                                            }
                                        >
                                            <FaListUl />
                                        </button>

                                        <button
                                            type="button"
                                            title="Numbered list"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "insertOrderedList"
                                                )
                                            }
                                        >
                                            <FaListOl />
                                        </button>

                                        <button
                                            type="button"
                                            title="Quote"
                                            onMouseDown={(event) =>
                                                handleNoteToolbarCommand(
                                                    event,
                                                    "formatBlock",
                                                    "blockquote"
                                                )
                                            }
                                        >
                                            ❝
                                        </button>
                                    </div>

                                    <div
                                        ref={editorRef}
                                        className="Note_Editor_Content"
                                        contentEditable={!openedNote.locked}
                                        suppressContentEditableWarning
                                        suppressHydrationWarning
                                        onInput={(event) => {
                                            setNoteDraft(
                                                event.currentTarget.innerHTML
                                            );
                                        }}
                                        onKeyDown={handleNoteEditorKeyDown}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="Note_Modal_Footer">
                            <span>
                                {stripHtml(noteDraft).length} characters
                            </span>

                            <div className="Note_Modal_Footer_Actions">
                                <button className="Note_Modal_Cancel_Button" onClick={handleCloseNote}>CANCEL</button>
                                <button className="Note_Modal_Save_Button" onClick={handleSaveNote}>SAVE</button>
                            </div>
                        </div>

                    </div>
                </div>
            )}



            {isFrameworkExpanded && currentFramework && (
                <div className="Framework_Expanded_Overlay">
                    <div className="Framework_Expanded_Modal">
                        <div className="Framework_Expanded_Header">
                            <div>
                                <p>FRAMEWORK OUTPUT · EDITABLE</p>
                                <h2>{currentFramework.title}</h2>
                            </div>

                            <div className="Framework_Expanded_Header_Actions">
                                <span>
                                    {frameworkSaveStatus === "saving"
                                        ? "SAVING..."
                                        : frameworkSaveStatus === "editing"
                                          ? "EDITING"
                                          : frameworkSaveStatus === "error"
                                            ? "SAVE ERROR"
                                            : "SAVED"}
                                </span>
                                <button type="button" onClick={() => setIsFrameworkExpanded(false)}>
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="Framework_Expanded_Body">
                            <aside className="Framework_Expanded_Nav">
                                <p>DOCUMENT</p>
                                <button type="button">Research question</button>
                                <button type="button">Working argument</button>
                                <button type="button">Claims & evidence</button>
                                <button type="button">Research gaps</button>

                                <div className="Framework_Linked_Sources">
                                    <p>LINKED SOURCES</p>
                                    {(currentFramework.sources || []).map((source) => (
                                        <span key={source.id}>● {source.title}</span>
                                    ))}
                                </div>
                            </aside>

                            <main className="Framework_Expanded_Editor">
                            <div className="Framework_Expanded_Toolbar">
                                <button
                                    type="button"
                                    onMouseDown={(event) =>
                                        handleExpandedFrameworkCommand(
                                            event,
                                            "formatBlock",
                                            "paragraph"
                                        )
                                    }
                                >
                                    Paragraph
                                </button>

                                <button
                                    type="button"
                                    onMouseDown={(event) =>
                                        handleExpandedFrameworkCommand(
                                            event,
                                            "bold"
                                        )
                                    }
                                >
                                    <b>B</b>
                                </button>

                                <button
                                    type="button"
                                    onMouseDown={(event) =>
                                        handleExpandedFrameworkCommand(
                                            event,
                                            "italic"
                                        )
                                    }
                                >
                                    <i>I</i>
                                </button>

                                <button type="button">Comment</button>
                            </div>

                            <div
                                ref={expandedFrameworkEditorRef}
                                className="Framework_Expanded_Content"
                                contentEditable
                                suppressContentEditableWarning
                                data-placeholder="Framework content will appear here..."
                                onInput={(event) =>
                                    setFrameworkEditorDraft(
                                        event.currentTarget.innerHTML
                                    )
                                }
                            />

                                <div className="Framework_Expanded_Refine_Bar">
                                    <input
                                        type="text"
                                        value={frameworkRefinementPrompt}
                                        onChange={(event) =>
                                            setFrameworkRefinementPrompt(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                                event.preventDefault();
                                                handleRefineFramework();
                                            }
                                        }}
                                        placeholder="Ask AI to revise a section, claim, gap, tone, or detail..."
                                        disabled={isFrameworkRefining}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRefineFramework}
                                        disabled={
                                            isFrameworkRefining ||
                                            !frameworkRefinementPrompt.trim()
                                        }
                                    >
                                        {isFrameworkRefining ? "Revising..." : "Apply with AI"}
                                    </button>
                                </div>

                                {frameworkGenerationError && (
                                    <p className="Framework_Expanded_Error">
                                        {frameworkGenerationError}
                                    </p>
                                )}
                            </main>
                        </div>

                        <div className="Framework_Expanded_Footer">
                            <span>
                                {frameworkEditorDraft.length} characters · {frameworkSaveStatus}
                            </span>

                            <div>
                                <button type="button" onClick={() => setIsFrameworkExpanded(false)}>
                                    Done editing
                                </button>

                                <button
                                    type="button"
                                    className="Dark"
                                    onClick={handleConvertFrameworkToOutline}
                                    disabled={isConvertingOutline}
                                >
                                    {isConvertingOutline
                                        ? "Converting..."
                                        : "Convert to Outline"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        
    );
}

export default CanvasBoard;