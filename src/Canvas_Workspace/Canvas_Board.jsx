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


const FRAMEWORK_STORAGE_SOURCE = "__nexo_framework__";
const OUTLINE_STORAGE_SOURCE = "__nexo_outline__";

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

    const dragStartSnapshot = useRef(null);

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
        notes: notes.map(n => ({
            ...n
        })),
        links: links.map(l => ({
            ...l
        })),
        boardOffset: { ...boardOffset },
        boardScale,
    });

    const restoreSnapshot = async (snapshot) => {
        setIsRestoringHistory(true);
    
        try {
            const currentNotes = [...notes];
            const currentLinks = [...links];
    
            // ---------- 1. 删除当前 links ----------
            await Promise.all(
                currentLinks.map(link =>
                    apiRequest(`/links/${link.id}`, {
                        method: "DELETE"
                    }).catch(() => {})
                )
            );
    
            // ---------- 2. 删除当前 notes ----------
            await Promise.all(
                currentNotes.map(note =>
                    apiRequest(`/notes/${note.id}`, {
                        method: "DELETE"
                    }).catch(() => {})
                )
            );
    
            // ---------- 3. 重建 notes ----------
            const idMap = {};
    
            for (const note of snapshot.notes) {
                const res = await apiRequest("/notes", {
                    method: "POST",
                    body: JSON.stringify({
                        title: note.title,
                        body: note.body,
                        user_note: note.userNote,
                        x: note.x,
                        y: note.y,
                        source_type: note.sourceType,
                        source_name: note.sourceName,
                        file_url: note.fileUrl,
                        file_size: note.fileSize,
                        chunks_added: note.chunksAdded,
                        db_total: note.dbTotal,
                    }),
                });
    
                idMap[note.id] = res.note.id;
            }
    
            // ---------- 4. 重建 links ----------
            for (const link of snapshot.links) {
                const from = idMap[link.fromNoteId];
                const to = idMap[link.toNoteId];
    
                if (from && to) {
                    await apiRequest("/links", {
                        method: "POST",
                        body: JSON.stringify({
                            from_note_id: from,
                            to_note_id: to,
                        }),
                    });
                }
            }
    
            // ---------- 5. reload ----------
            await loadNotesFromDatabase();
            await loadLinksFromDatabase();
    
            setBoardOffset(snapshot.boardOffset);
            setBoardScale(snapshot.boardScale);
    
        } catch (err) {
            console.error("Restore snapshot failed:", err);
            alert("Undo/Redo failed.");
        }
    
        setIsRestoringHistory(false);
    };

    /** When file upload success it will be package in the way we want so later can put into the PGSQL*/
    const handleUploadSuccess = async (uploadedFile, uploadResult) => {
        const newNoteData = {
            title: uploadedFile.name,
            body: `File name: ${uploadResult?.file || uploadedFile.name}`,
            user_note: "",
            x: 260 + notes.length * 35,
            y: 120 + notes.length * 35,
            source_type: "pdf",
            source_name: uploadResult?.file || uploadedFile.name,
            file_url: uploadResult?.fileUrl || "",
            file_size: uploadResult?.fileSize || uploadedFile.size,
            chunks_added: uploadResult?.chunks_added ?? null,
            db_total: uploadResult?.db_total ?? null,
        };

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);

            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);

            const newCabinetFile = convertNoteToCabinetFile(newCanvasNote);
            setFiles((prevFiles) => [newCabinetFile, ...prevFiles]);
        } catch (error) {
            console.error("Create uploaded PDF note error:", error);
            alert("PDF uploaded, but failed to create note on board.");
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
    const handleSendDocToBoard = async (doc) => {
        const newNoteData = {
            title: doc.title,
            body: doc.description || "Note from database source.",
            user_note: "",
            x: 300 + notes.length * 30,
            y: 120 + notes.length * 30,
        };

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);

            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);
        } catch (error) {
            console.error("Create database note error:", error);
            alert("Failed to send document to board.");
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
    /** This function will count the number of note been selected */
    const selectedNotesCount = notes.filter((note) => note.selected).length;
    /***************************************************************************/
    const zoomPercentage = Math.round(boardScale * 100);
    /***************************************************************************/
    const hoveredNote = notes.find((note) => note.id === hoveredNoteId);
    /***************************************************************************/
    const openedNote = notes.find((note) => note.id === openedNoteId);
    /***************************************************************************/
    const handleSendMessage = async () => {
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
                .filter((note) => note.selected && note.sourceName)
                .map((note) => note.sourceName);

            const uniqueSelectedSourceNames = [...new Set(selectedSourceNames)];

            const shouldUseRag = uniqueSelectedSourceNames.length > 0;

            const sourceFilter =
                uniqueSelectedSourceNames.length === 1
                    ? uniqueSelectedSourceNames[0]
                    : "";

            const selectedSourcesText =
                uniqueSelectedSourceNames.length > 0
                    ? uniqueSelectedSourceNames.map((name, index) => `${index + 1}. ${name}`).join("\n")
                    : "No selected sources.";

            const isAskingSelectedSources =
                /(source|sources|doc|docs|document|documents|selected|selecting|file|files|name|names)/i.test(question);

            const enhancedQuestion = shouldUseRag
                ? `The user has selected the following source files:\n${selectedSourcesText}\n\nUser question: ${question}`
                : question;

            console.log("CHAT RAG DEBUG:", {
                question,
                shouldUseRag,
                selectedSources: uniqueSelectedSourceNames,
                sourceFilter,
                enhancedQuestion,
            });

            const data = await apiRequest("/ai/query-text", {
                method: "POST",
                body: JSON.stringify({
                    question: enhancedQuestion,
                    top_k: 3,
                    use_rag: shouldUseRag,
                    source_filter: sourceFilter,
                    chat_history: chatHistoryForApi,
                }),
            });

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
                text: "Failed to get an answer from the AI service."
            };

            setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsAiThinking(false);
        }
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
    const handleNoteMouseDown = (event, note) => {
        dragStartSnapshot.current = getSnapshot();

        event.stopPropagation();

        const canvasRect = event.currentTarget.closest(".Canvas_Center").getBoundingClientRect();

        setDraggingNoteId(note.id);
        setHasDraggedNote(false);

        setDragOffset({
            x: (event.clientX - canvasRect.left - boardOffset.x) / boardScale - note.x,
            y: (event.clientY - canvasRect.top - boardOffset.y) / boardScale - note.y,
        });
    };
    /***************************************************************************/
    const handleCanvasMouseMove = (event) => {
        if (draggingNoteId !== null) {
            setHasDraggedNote(true);

            const canvasRect = event.currentTarget.getBoundingClientRect();

            const newX = (event.clientX - canvasRect.left - boardOffset.x) / boardScale - dragOffset.x;
            const newY = (event.clientY - canvasRect.top - boardOffset.y) / boardScale - dragOffset.y;

            setNotes((prevNotes) =>
                prevNotes.map((note) =>
                    note.id === draggingNoteId
                        ? { ...note, x: newX, y: newY }
                        : note
                )
            );
            return;
        }

        if (isPanningBoard) {
            setBoardOffset({
                x: event.clientX - panStart.x,
                y: event.clientY - panStart.y,
            });
        }
    };
    /***************************************************************************/
    const handleCanvasMouseUp = async () => {
        if (draggingNoteId !== null && hasDraggedNote) {
            const before = dragStartSnapshot.current;
        
            const draggedNote = notes.find(n => n.id === draggingNoteId);
        
            if (draggedNote) {
                await updateNoteInDatabase(draggedNote.id, {
                    x: draggedNote.x,
                    y: draggedNote.y,
                });
        
                setUndoStack(s => [...s, before]);
                setRedoStack([]);
            }
        }

        setDraggingNoteId(null);
        setIsPanningBoard(false);
    };
    /***************************************************************************/
    const handleCanvasWheel = (event) => {
        if (undoStack.length === 0 || undoStack[undoStack.length - 1]._zoom !== true) {
            setUndoStack(stack => [...stack, { ...getSnapshot(), _zoom: true }]);
            setRedoStack([]);
        }

        event.preventDefault();

        const zoomSpeed = 0.0015;
        const minScale = 0.4;
        const maxScale = 2.5;

        const canvasRect = event.currentTarget.getBoundingClientRect();

        const mouseX = event.clientX - canvasRect.left;
        const mouseY = event.clientY - canvasRect.top;

        const worldX = (mouseX - boardOffset.x) / boardScale;
        const worldY = (mouseY - boardOffset.y) / boardScale;

        const nextScale = Math.min(
            maxScale,
            Math.max(minScale, boardScale - event.deltaY * zoomSpeed)
        );

        const nextOffsetX = mouseX - worldX * nextScale;
        const nextOffsetY = mouseY - worldY * nextScale;

        setBoardScale(nextScale);
        setBoardOffset({
            x: nextOffsetX,
            y: nextOffsetY,
        });
    };
    /***************************************************************************/
    const handleBoardMouseDown = (event) => {
        const isCanvasBackground = event.target.classList.contains("Canvas_Center") || event.target.classList.contains("Canvas_World");

        if (!isCanvasBackground) {
            return;
        }

        setUndoStack(stack => [...stack, getSnapshot()]);
        setRedoStack([]);

        setIsPanningBoard(true);
        setPanStart({
            x: event.clientX - boardOffset.x,
            y: event.clientY - boardOffset.y,
        });
    };
    /***************************************************************************/
    const handleResetView = () => {
        setUndoStack(stack => [...stack, getSnapshot()]);
        setRedoStack([]);
    
        setBoardOffset({ x: 0, y: 0 });
        setBoardScale(1);
    };
    /***************************************************************************/
    const handleLinkSelectedNotes = async () => {
        const before = getSnapshot();

        const selectedNotes = notes.filter((note) => note.selected);

        if (selectedNotes.length < 2) {
            alert("Please select at least 2 notes to link");
            return;
        }

        const newLinks = [];

        for (let i = 0; i < selectedNotes.length - 1; i++) {
            const fromNoteId = selectedNotes[i].id;
            const toNoteId = selectedNotes[i + 1].id;

            if (!linkAlreadyExists(fromNoteId, toNoteId)) {
                const createdLink = await createLinkInDatabase(fromNoteId, toNoteId);

                if (createdLink) {
                    newLinks.push(createdLink);
                }
            }
        }

        if (newLinks.length > 0) {
            setLinks((prevLinks) => [...prevLinks, ...newLinks]);
            setUndoStack(s => [...s, before]);
            setRedoStack([]);
        }
    };
    /***************************************************************************/
    const getNoteById = (noteId) => {
        return notes.find((note) => note.id === noteId);
    };
    /***************************************************************************/
    /** This function deletes selected notes from both the board and Supabase */
    const handleDeleteSelectedNote = async () => {
        const before = getSnapshot();

        const selectedNoteId = notes
            .filter((note) => note.selected)
            .map((note) => note.id);

        if (selectedNoteId.length === 0) {
            return;
        }

        const deleteResults = await Promise.all(
            selectedNoteId.map((noteId) => deleteNoteFromDatabase(noteId))
        );

        const successfullyDeletedIds = selectedNoteId.filter(
            (noteId, index) => deleteResults[index]
        );

        setNotes((prevNotes) =>
            prevNotes.filter((note) => !successfullyDeletedIds.includes(note.id))
        );

        setFiles((prevFiles) =>
            prevFiles.filter((file) => !successfullyDeletedIds.includes(file.noteId))
        );

        setLinks((prevLinks) =>
            prevLinks.filter(
                (link) =>
                    !successfullyDeletedIds.includes(link.fromNoteId) &&
                    !successfullyDeletedIds.includes(link.toNoteId)
            )
        );

        setUndoStack(s => [...s, before]);
        setRedoStack([]);
    };
    /***************************************************************************/
    const linkAlreadyExists = (fromNoteId, toNoteId) => {
        return links.some((link) => {
            const sameDirection = link.fromNoteId === fromNoteId && link.toNoteId === toNoteId;
            const oppositeDirection = link.fromNoteId === toNoteId && link.toNoteId === fromNoteId;
            return sameDirection || oppositeDirection;
        });
    }
    /***************************************************************************/
    const handleOpenNote = (note) => {
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
        const editorHtml = editorRef.current ? editorRef.current.innerHTML : "";

        const updatedNote = await updateNoteInDatabase(openedNoteId, {
            user_note: editorHtml,
        });

        if (!updatedNote) {
            return;
        }

        setNotes((prevNotes) => 
            prevNotes.map((note) =>
                note.id === openedNoteId ? {...note, userNote: editorHtml} : note
            )
        );

        setNoteDraft(editorHtml);
        handleCloseNote();
    }
    /***************************************************************************/
    const handleEditorCommand = (command, value = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
        }

        document.execCommand(command, false, value);

        if (editorRef.current) {
            setNoteDraft(editorRef.current.innerHTML);
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
                : sourceType === "outline" || sourceName === OUTLINE_STORAGE_SOURCE
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

            sourceType,
            sourceName,
            noteKind,
            fileUrl: note.file_url || "",
            fileSize: note.file_size || null,
            chunksAdded: note.chunks_added || null,
            dbTotal: note.db_total || null,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
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
        topK = 5,
        signal,
    }) => {
        const data = await apiRequest("/ai/query-text", {
            method: "POST",
            ...(signal ? { signal } : {}),
            body: JSON.stringify({
                question,
                top_k: topK,
                use_rag: useRag,
                source_filter: sourceFilter,
                chat_history: [],
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
    const selectedNotes = notes.filter((note) => note.selected);

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
            alert("Select at least one note.");
            return;
        }
    
        setFrameworkStep("generating");
    
        try {
            const combinedText = selectedNotes
                .map((n) => `SOURCE: ${n.title}\n${n.body}`)
                .join("\n\n");
    
            const frameworkText = `
    RESEARCH QUESTION
    ${frameworkDirection || "What relationships exist across the selected sources?"}
    
    WORKING ARGUMENT
    ${frameworkArgument || "The selected materials suggest a pattern of interpretation shaped by source context."}
    
    FRAMEWORK
    
    1. Key Concepts
    - Extracted from selected sources
    
    2. Claims & Evidence
    ${combinedText.slice(0, 2000)}
    
    3. Source Relationships
    - These sources interact through shared themes
    
    4. Research Gaps
    - Missing connections between sources
    
    5. Contribution
    - A synthesized interpretation
            `.trim();
    
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify({
                    title: "Framework",
                    body: frameworkText,
                }),
            });
    
            setCurrentFramework({
                id: data.note.id,
                content: frameworkText,
            });
    
            setFrameworkEditorDraft(frameworkText);
            setFrameworkStep("output");
    
        } catch (err) {
            console.error(err);
            alert("Failed.");
            setFrameworkStep("setup");
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
        const frameworkText =
            stripHtml(frameworkEditorDraft).trim() ||
            stripHtml(currentFramework?.content || "").trim();
    
        if (!frameworkText) {
            alert("There is no Framework content to convert.");
            return;
        }

        setIsConvertingOutline(true);
    
        const outlineTitle = `Outline - ${
            currentFramework?.title || "Framework"
        }`;
    
        const outlineText = `
    OUTLINE
    
    I. INTRODUCTION
    - Research topic: ${frameworkDirection || "Topic derived from the Framework"}
    - Background and research context
    - Research question
    - Working thesis or argument
    
    II. KEY CONCEPTS AND THEORETICAL CONTEXT
    - Define the main concepts
    - Explain the relevant theoretical framework
    - Establish the terms used in the research
    
    III. MAIN ARGUMENTS AND EVIDENCE
    ${frameworkText}
    
    IV. SOURCE RELATIONSHIPS
    - Explain how the selected sources support one another
    - Identify agreements, tensions, and contradictions
    - Connect evidence to each major claim
    
    V. RESEARCH GAPS
    - Identify missing evidence
    - Note unresolved questions
    - List areas requiring further research
    
    VI. ORIGINAL CONTRIBUTION
    - State the new interpretation or contribution
    - Explain how the argument extends existing research
    
    VII. CONCLUSION
    - Restate the central argument
    - Summarize the strongest evidence
    - Explain the significance of the research
        `.trim();
    
        // The note editor stores editable content as HTML.
        const escapeHtml = (value) =>
            value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
    
        const outlineHtml = escapeHtml(outlineText).replace(/\n/g, "<br>");
    
        // Put the new card in the currently visible part of the Canvas,
        // instead of the hidden default position x=0, y=0.
        const stagger = (notes.length % 5) * 24;
    
        const outlineX =
            (380 - boardOffset.x) / boardScale + stagger;
    
        const outlineY =
            (150 - boardOffset.y) / boardScale + stagger;
    
        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify({
                    title: outlineTitle,
                    body: outlineText,
                    user_note: outlineHtml,
                    x: outlineX,
                    y: outlineY,
    
                    // Keep an already-supported database value.
                    source_type: "pdf",
                    source_name: OUTLINE_STORAGE_SOURCE,
                }),
            });
    
            const newOutlineNote =
                convertDatabaseNoteToCanvasNote(data.note);
    
            // Immediately show it on the Canvas.
            setNotes((prevNotes) => [
                ...prevNotes,
                newOutlineNote,
            ]);
    
            // Immediately show it in the Cabinet.
            const newCabinetFile =
                convertNoteToCabinetFile(newOutlineNote);
    
            setFiles((prevFiles) => [
                newCabinetFile,
                ...prevFiles,
            ]);
    
            // Close the Framework interfaces.
            setIsFrameworkExpanded(false);
            setIsFrameworkPanelOpen(false);
    
            // Open the new Outline in the existing note editor.
            handleOpenNote(newOutlineNote);
    
            alert("Outline created and opened.");
        } catch (error) {
            console.error("Convert to Outline error:", error);
        
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
        };
    }, []);
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
        if (undoStack.length === 0 || isRestoringHistory) return;
    
        const prev = undoStack[undoStack.length - 1];
    
        setUndoStack(s => s.slice(0, -1));
        setRedoStack(s => [...s, getSnapshot()]);
    
        await restoreSnapshot(prev);
    };

    const handleRedo = async () => {
        if (redoStack.length === 0 || isRestoringHistory) return;
    
        const next = redoStack[redoStack.length - 1];
    
        setRedoStack(s => s.slice(0, -1));
        setUndoStack(s => [...s, getSnapshot()]);
    
        await restoreSnapshot(next);
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
        };

        const before = getSnapshot();

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);
            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);
            setUndoStack(s => [...s, before]);
            setRedoStack([]);
        } catch (error) {
            console.error("Create blank note error:", error);
            alert("Failed to create note.");
        }
    };

    const handleCluster = () => {
        alert("Cluster will be added later.");
    };

    const handleAutoArrange = async () => {
        const before = getSnapshot();
    
        const updated = notes.map((note, index) => ({
            ...note,
            x: 280 + (index % 4) * 220,
            y: 120 + Math.floor(index / 4) * 190,
        }));
    
        setNotes(updated);
    
        await Promise.all(
            updated.map(n =>
                updateNoteInDatabase(n.id, { x: n.x, y: n.y })
            )
        );
    
        setUndoStack(s => [...s, before]);
        setRedoStack([]);
    };

    const handleLockSelected = () => {
        alert("Lock selected will be added later.");
    };

    const handlePinTop = () => {
        alert("Pin top will be added later.");
    };

    const handleSearchSources = (keyword) => {
        console.log("Search sources:", keyword);
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
                        <svg className="Canvas_Link_Layer">
                            {links.map((link) => {
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

                        {notes.map((note) => (
                        /** If the note is selected then we will add a new class ("Canvas_Note_Selected") to it, in this way we can change the color of the note to darker */
                            <div className={`Canvas_Note_Card ${note.selected ? "Canvas_Note_Selected" : ""}`} 
                                key={note.id} 
                                onMouseEnter={() => setHoveredNoteId(note.id)}
                                onMouseLeave={() => setHoveredNoteId(null)}  
                                onClick={() => {
                                    if (!hasDraggedNote) {
                                        handleNoteClick(note.id);
                                    }
                                }} 
                                onMouseDown={(event) => handleNoteMouseDown(event,note)} 
                                style={{left: `${note.x}px`, top: `${note.y}px`,}}
                            > 
                                <p className="Canvas_Note_Title">{note.title}</p>
                                <p className="Canvas_Note_Body">{note.body.length > 90 ? `${note.body.slice(0, 90)}...` : note.body}</p>
                                <p className="Canvas_Note_Meta">
                                    {note.noteKind === "outline"
                                        ? "Generated Outline"
                                        : note.noteKind === "pdf"
                                          ? "PDF Source"
                                          : "Note"}
                                </p>
                                <div className="Canvas_Note_Dot"></div>
                            </div>
                        ))}

                        {hoveredNote && (
                            <div className="Note_Preview_Card" style={{left: `${hoveredNote.x + NOTE_WIDTH + 8}px`, top: `${hoveredNote.y}px`}} onMouseEnter={() => setHoveredNoteId(hoveredNote.id)} onMouseLeave={() => setHoveredNoteId(null)}>
                                <p className="Note_Preview_Label">
                                    {hoveredNote.noteKind === "outline" ? "OUTLINE" : "PAPER"}
                                </p>
                                <h3>{hoveredNote.title}</h3>
                                <p className="Note_Preview_Label">ABSTRACT</p>
                                <p className="Note_Preview_Text">{hoveredNote.body}</p>
                                <p className="Note_Preview_Label">CONNECTIONS</p>
                                <p className="Note_Preview_Number">
                                    {
                                        links.filter(
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
                        <span className="Canvas_Zoom_Text">{zoomPercentage}%</span>
                        <span className="Canvas_Link_Count_Text">{links.length} links</span>
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
                                                                    <ReactMarkdown>{message.text}</ReactMarkdown>
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
                                    {openedNote.sourceType === "pdf" && openedNote.fileUrl ? (
                                        <div className="Note_PDF_Preview">
                                            <iframe
                                                src={openedNote.fileUrl}
                                                title={openedNote.title}
                                            />
                                        </div>
                                    ) : (
                                        <p className="Note_Source_Text">
                                            {openedNote?.body || "No source preview available."}
                                        </p>
                                    )}
                                </div>

                                
                            </div>

                            <div className="Note_User_Column">
                                <div className="Note_Editor">
                                    <div className="Note_Editor_Header">
                                        <input className="Note_Editor_Title_Input" value={openedNote.title} readOnly/>

                                        <button className="Note_Editor_Delete_Button"><MdDelete /></button>
                                    </div>

                                    <div className="Note_Editor_Toolbar">
                                        <button type="button"><TiArrowBack /></button>
                                        <button type="button"><TiArrowForward /></button>

                                        <select onChange={(event) => handleEditorCommand("formatBlock", event.target.value)} defaultValue="p">
                                            <option value="p">Normal</option>
                                            <option value="h1">Heading 1</option>
                                            <option value="h2">Heading 2</option>
                                            <option value="blockquote">Quote</option>
                                        </select>

                                        <button type="button" onClick={() => handleEditorCommand("bold")}><b>B</b></button>
                                        <button type="button" onClick={() => handleEditorCommand("italic")}><i>I</i></button>
                                        <button type="button" onClick={() => {const url = prompt("Enter link URL:"); if (url) {handleEditorCommand("createLink", url)}}}><IoLinkSharp /></button>
                                        <button type="button" onClick={() => handleEditorCommand("formatBlock", "pre")}>&lt;&gt;</button>
                                        <button type="button" onClick={() => handleEditorCommand("insertUnorderedList")}><FaListUl /></button>
                                        <button type="button" onClick={() => handleEditorCommand("insertOrderedList")}><FaListOl /></button>
                                        <button type="button" onClick={() => handleEditorCommand("formatBlock", "blockquote")}>❝</button>
                                        <button type="button">—</button>
                                    </div>
                                    <div ref={editorRef} className="Note_Editor_Content" contentEditable suppressContentEditableWarning suppressHydrationWarning onInput={(event) => setNoteDraft(event.currentTarget.innerHTML)}/>
                                </div>
                            </div>

                        </div>

                        <div className="Note_Modal_Footer">
                            <span>{noteDraft.length} characters</span>

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