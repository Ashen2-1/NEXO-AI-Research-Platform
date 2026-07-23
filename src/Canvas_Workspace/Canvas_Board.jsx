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
    const [isFrameworkExpanded, setIsFrameworkExpanded] = useState(false);
    const [frameworkEditorDraft, setFrameworkEditorDraft] = useState("");

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
            const draggedNote = notes.find((note) => note.id === draggingNoteId);

            if (draggedNote) {
                await updateNoteInDatabase(draggedNote.id, {
                    x: draggedNote.x,
                    y: draggedNote.y,
                });
            }
        }


        setDraggingNoteId(null);
        setIsPanningBoard(false);
    };
    /***************************************************************************/
    const handleCanvasWheel = (event) => {
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

        setIsPanningBoard(true);
        setPanStart({
            x: event.clientX - boardOffset.x,
            y: event.clientY - boardOffset.y,
        });
    };
    /***************************************************************************/
    const handleResetView = () => {
        setBoardOffset({ x: 0, y: 0 });
        setBoardScale(1);
    };
    /***************************************************************************/
    const handleLinkSelectedNotes = async () => {
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
        }
    };
    /***************************************************************************/
    const getNoteById = (noteId) => {
        return notes.find((note) => note.id === noteId);
    };
    /***************************************************************************/
    /** This function deletes selected notes from both the board and Supabase */
    const handleDeleteSelectedNote = async () => {
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
    const convertDatabaseNoteToCanvasNote = (note) => {
        return {
            id: note.id,
            title: note.title,
            body: note.body || "",
            userNote: note.user_note || "",
            x: Number(note.x),
            y: Number(note.y),
            selected: false,

            sourceType: note.source_type || "pdf",
            sourceName: note.source_name || note.title,
            fileUrl: note.file_url || "",
            fileSize: note.file_size || null,
            chunksAdded: note.chunks_added || null,
            dbTotal: note.db_total || null,
            createdAt: note.created_at,
        };
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
    const loadNotesFromDatabase = async () => {
        try {
            const data = await apiRequest("/notes");

            const databaseNotes = data.notes.map(convertDatabaseNoteToCanvasNote);

            setNotes(databaseNotes);

            const cabinetFiles = databaseNotes
                .filter((note) => note.fileUrl || note.sourceName)
                .map(convertNoteToCabinetFile);

            setFiles(cabinetFiles);
        } catch (error) {
            console.error("Load notes error:", error);
        }
    };
    /***************************************************************************/
    const handleGenerateFramework = async () => {
        if (selectedNotes.length === 0) {
            alert("Please select at least one note to generate a framework.");
            return;
        }

        setFrameworkStep("generating");

        setTimeout(() => {
            const mockFramework = {
                id: Date.now(),
                title: "Framework V1",
                status: "Saved",
                sourceCount: selectedNotes.length,
                detailLevel: frameworkDetailLevel,
                sources: selectedFrameworkSources,
                content: `
    RESEARCH QUESTION
    How do the selected sources help construct a research argument?

    WORKING ARGUMENT
    The selected materials suggest that visual evidence is not neutral. It is shaped by archives, interpretation, absence, and the way sources are connected.

    FRAMEWORK SECTIONS

    01 Key Concepts and Theory
    - Identify the major concepts in the selected notes.
    - Explain how these concepts define the research direction.

    02 Claims and Evidence
    - Extract the strongest claims from the selected sources.
    - Link each claim to supporting evidence.

    03 Source Relationships
    - Explain how the selected notes support, extend, challenge, or complicate one another.

    04 Research Gaps
    - Identify missing evidence, unclear assumptions, or areas requiring further investigation.

    05 Original Contribution
    - Suggest what new argument or interpretation could emerge from these materials.
                `.trim(),
            };

            setCurrentFramework(mockFramework);
            setFrameworkEditorDraft(mockFramework.content);
            setFrameworkStep("output");
        }, 1200);
    };


    const selectedNotes = notes.filter((note) => note.selected);

    const selectedFrameworkSources = selectedNotes.map((note) => ({
        id: note.id,
        title: note.title,
        body: note.body,
        sourceName: note.sourceName || note.title,
    }));


    useEffect(() => {
        loadNotesFromDatabase();
        loadLinksFromDatabase();
    }, []);
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

    const handleUndo = () => {
        console.log("Undo clicked");
    };

    const handleRedo = () => {
        console.log("Redo clicked");
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

        try {
            const data = await apiRequest("/notes", {
                method: "POST",
                body: JSON.stringify(newNoteData),
            });

            const newCanvasNote = convertDatabaseNoteToCanvasNote(data.note);
            setNotes((prevNotes) => [...prevNotes, newCanvasNote]);
        } catch (error) {
            console.error("Create blank note error:", error);
            alert("Failed to create note.");
        }
    };

    const handleCluster = () => {
        alert("Cluster will be added later.");
    };

    const handleAutoArrange = () => {
        setNotes((prevNotes) =>
            prevNotes.map((note, index) => ({
                ...note,
                x: 280 + (index % 4) * 220,
                y: 120 + Math.floor(index / 4) * 190,
            }))
        );
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
                onFramework={() => {setIsFrameworkPanelOpen(true);setFrameworkStep("setup");setIsChatOpen(true);}}
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
                                <p className="Canvas_Note_Meta">PDF Source</p>
                                <div className="Canvas_Note_Dot"></div>
                            </div>
                        ))}

                        {hoveredNote && (
                            <div className="Note_Preview_Card" style={{left: `${hoveredNote.x + NOTE_WIDTH + 8}px`, top: `${hoveredNote.y}px`}} onMouseEnter={() => setHoveredNoteId(hoveredNote.id)} onMouseLeave={() => setHoveredNoteId(null)}>
                                <p className="Note_Preview_Label">PAPER</p>
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
                                    frameworkEditorDraft={frameworkEditorDraft}
                                    setFrameworkEditorDraft={setFrameworkEditorDraft}
                                    onGenerate={handleGenerateFramework}
                                    onClose={() => setIsFrameworkPanelOpen(false)}
                                    onExpand={() => setIsFrameworkExpanded(true)}
                                    onConvertToOutline={() => alert("Convert to Outline will be added next.")}
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
                                <span>SAVED</span>
                                <button type="button" onClick={() => setIsFrameworkExpanded(false)}>
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="Framework_Expanded_Body">
                            <aside className="Framework_Expanded_Nav">
                                <p>DOCUMENT OUTLINE</p>
                                <button>RQ Research direction</button>
                                <button>01 Index & evidence</button>
                                <button>02 Archive & power</button>
                                <button>03 Research gap</button>

                                <div className="Framework_Linked_Sources">
                                    <p>LINKED SOURCES</p>
                                    {currentFramework.sources.map((source) => (
                                        <span key={source.id}>● {source.title}</span>
                                    ))}
                                </div>
                            </aside>

                            <main className="Framework_Expanded_Editor">
                                <div className="Framework_Expanded_Toolbar">
                                    <button>Paragraph</button>
                                    <button><b>B</b></button>
                                    <button><i>I</i></button>
                                    <button>Comment</button>
                                </div>

                                <textarea
                                    value={frameworkEditorDraft}
                                    onChange={(event) => setFrameworkEditorDraft(event.target.value)}
                                />
                            </main>
                        </div>

                        <div className="Framework_Expanded_Footer">
                            <span>{frameworkEditorDraft.length} characters · All changes saved</span>

                            <div>
                                <button type="button" onClick={() => setIsFrameworkExpanded(false)}>
                                    Done editing
                                </button>

                                <button type="button" className="Dark">
                                    Convert to Outline
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