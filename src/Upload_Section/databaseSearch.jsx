import "./databaseSearch.css";
import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
//import { supabase } from "../lib/supabase";
import { CiShare1 } from "react-icons/ci";
import { apiRequest } from "../api";

function DatabaseSearch({ showModal, onClose, onSendToBoard }) {

    const [docs, setDocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [yearFrom, setYearFrom] = useState("");
    const [yearTo, setYearTo] = useState("");
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [sentDocId, setSentDocId] = useState(null);

    const [activeTab, setActiveTab] = useState("all");

    const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");

    const [isSearching, setIsSearching] = useState(false);

    const [searchError, setSearchError] = useState("");

    const [sourceOptions, setSourceOptions] = useState([]);
    const [contentTypeOptions, setContentTypeOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);
    const [accessTypeOptions, setAccessTypeOptions] = useState([]);
    const [tagOptions, setTagOptions] = useState([]);

    const [selectedSources, setSelectedSources] = useState([
    /*    
        "JSTOR",
        "Local Archive",
        "Artstor",
        "Artsy",
        "Custom"
    */
    ]);
    
    const [selectedContentTypes, setSelectedContentTypes] = useState([
    /*
        "article",
        "book_catalog",
        "image_artwork",
        "thesis_report"
    */
    ]);
    
    const [selectedLanguages, setSelectedLanguages] = useState([
    /*
        "English",
        "Chinese",
        "Other"
    */
    ]);
    
    const [selectedAccessTypes, setSelectedAccessTypes] = useState([
    /*
        "full_text",
        "abstract_only",
        "open_access"
    */
    ]);

    const [selectedTags, setSelectedTags] = useState([
    /*
        "photography",
        "spectral",
        "archive",
        "gender",
        "coloniality"
    */
    ]);

    /***************************************************************************/
    /** This function loads all available filter options from the documents table */
    async function fetchFilterOptions() {
        try {
            const data = await apiRequest("/documents/filters");

            setSourceOptions(data.sources || []);
            setContentTypeOptions(data.contentTypes || []);
            setLanguageOptions(data.languages || []);
            setAccessTypeOptions(data.accessTypes || []);
            setTagOptions(data.tags || []);
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    }

    /***************************************************************************/
    /** This effect loads filter options from database when the popup opens */
    useEffect(() => {
        if (showModal) {
            fetchFilterOptions();
        }
    }, [showModal]);

    async function fetchLocalDocuments(
        search
    ) {
        const params =
            new URLSearchParams();
    
        if (search.trim()) {
            params.append(
                "search",
                search.trim()
            );
        }
    
        if (
            selectedSources.length > 0
        ) {
            params.append(
                "sources",
                selectedSources.join(",")
            );
        }
    
        if (
            selectedContentTypes.length >
            0
        ) {
            params.append(
                "contentTypes",
                selectedContentTypes.join(
                    ","
                )
            );
        }
    
        if (
            selectedLanguages.length > 0
        ) {
            params.append(
                "languages",
                selectedLanguages.join(",")
            );
        }
    
        if (
            selectedAccessTypes.length >
            0
        ) {
            params.append(
                "accessTypes",
                selectedAccessTypes.join(
                    ","
                )
            );
        }
    
        if (
            selectedTags.length > 0
        ) {
            params.append(
                "tags",
                selectedTags.join(",")
            );
        }
    
        if (yearFrom.trim()) {
            params.append(
                "yearFrom",
                yearFrom.trim()
            );
        }
    
        if (yearTo.trim()) {
            params.append(
                "yearTo",
                yearTo.trim()
            );
        }
    
        const queryString =
            params.toString();
    
        const data = await apiRequest(
            queryString
                ? `/documents?${queryString}`
                : "/documents"
        );
    
        return data.documents || [];
    }
    
    
    async function fetchOpenAlexDocuments(
        search
    ) {
        const normalizedSearch =
            search.trim();
    
        if (
            normalizedSearch.length < 2
        ) {
            return [];
        }
    
        const params =
            new URLSearchParams({
                search:
                    normalizedSearch,
    
                perPage:
                    "20",
            });
    
        if (yearFrom.trim()) {
            params.append(
                "yearFrom",
                yearFrom.trim()
            );
        }
    
        if (yearTo.trim()) {
            params.append(
                "yearTo",
                yearTo.trim()
            );
        }
    
        if (
            selectedContentTypes.length >
            0
        ) {
            params.append(
                "contentTypes",
                selectedContentTypes.join(
                    ","
                )
            );
        }
    
        if (
            selectedLanguages.length > 0
        ) {
            params.append(
                "languages",
                selectedLanguages.join(",")
            );
        }
    
        if (
            selectedAccessTypes.length >
            0
        ) {
            params.append(
                "accessTypes",
                selectedAccessTypes.join(
                    ","
                )
            );
        }
    
        const data = await apiRequest(
            `/documents/openalex?${params.toString()}`
        );
    
        return data.documents || [];
    }
    
    
    function mergeUniqueDocuments(
        localDocuments,
        openAlexDocuments
    ) {
        const seen = new Set();
    
        return [
            ...localDocuments,
            ...openAlexDocuments,
        ].filter((doc) => {
            const key = String(
                doc.doi ||
                doc.openalex_id ||
                doc.id ||
                `${doc.title}-${doc.publication_year}`
            ).toLowerCase();
    
            if (seen.has(key)) {
                return false;
            }
    
            seen.add(key);
            return true;
        });
    }
    
    
    async function fetchDocuments(
        search = submittedSearchTerm,
        tab = activeTab
    ) {
        setIsSearching(true);
        setSearchError("");
        setSelectedDoc(null);
    
        try {
            if (tab === "local") {
                const localDocuments =
                    await fetchLocalDocuments(
                        search
                    );
    
                setDocs(localDocuments);
                return;
            }
    
            if (tab === "external") {
                if (
                    search.trim().length <
                    2
                ) {
                    setDocs([]);
                    return;
                }
    
                const openAlexDocuments =
                    await fetchOpenAlexDocuments(
                        search
                    );
    
                setDocs(
                    openAlexDocuments
                );
    
                return;
            }
    
            /*
              ALL:
              Local results are always loaded.
              OpenAlex is queried only when a search
              term has at least 2 characters.
            */
            const localDocuments =
                await fetchLocalDocuments(
                    search
                );
    
            let openAlexDocuments = [];
    
            if (
                search.trim().length >= 2
            ) {
                try {
                    openAlexDocuments =
                        await fetchOpenAlexDocuments(
                            search
                        );
                } catch (
                    openAlexError
                ) {
                    console.error(
                        "OpenAlex part of ALL search failed:",
                        openAlexError
                    );
    
                    setSearchError(
                        `Local results loaded, but OpenAlex failed: ${
                            openAlexError.message ||
                            "Unknown error"
                        }`
                    );
                }
            }
    
            setDocs(
                mergeUniqueDocuments(
                    localDocuments,
                    openAlexDocuments
                )
            );
        } catch (error) {
            console.error(
                "Failed to fetch documents:",
                error
            );
    
            setDocs([]);
    
            setSearchError(
                error.message ||
                "Search failed."
            );
        } finally {
            setIsSearching(false);
        }
    }
    
    
    const submitSearch = () => {
        const nextSearch =
            searchTerm.trim();
    
        if (
            nextSearch ===
            submittedSearchTerm
        ) {
            fetchDocuments(
                nextSearch,
                activeTab
            );
    
            return;
        }
    
        setSubmittedSearchTerm(
            nextSearch
        );
    };
    
    
    const changeSearchTab = (
        nextTab
    ) => {
        setActiveTab(nextTab);
        setSelectedDoc(null);
        setSearchError("");
    
        /*
          When switching to OpenAlex or ALL,
          use the current input as the submitted query.
        */
        if (
            nextTab !== "local" &&
            searchTerm.trim()
        ) {
            setSubmittedSearchTerm(
                searchTerm.trim()
            );
        }
    };
    
    
    useEffect(() => {
        if (!showModal) {
            return;
        }
    
        fetchDocuments(
            submittedSearchTerm,
            activeTab
        );
    }, [
        showModal,
        activeTab,
        submittedSearchTerm,
        selectedSources,
        selectedContentTypes,
        selectedLanguages,
        selectedAccessTypes,
        selectedTags,
        yearFrom,
        yearTo,
    ]);

    function toggleFilter(value, selectedList, setSelectedList) {
        if (selectedList.includes(value)) {
            setSelectedList(selectedList.filter((item) => item !== value));
        } else {
            setSelectedList([...selectedList, value]);
        }
    }

    /***************************************************************************/
    /** This function converts database-style labels into readable UI text */
    function formatLabel(text) {
        return text
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    if (!showModal) {
        return null;
    }

    return (
        <div className="database-overlay">
            <div className="database-modal">

                <div className="database-topbar">

                <div className="database-tabs">
                    <button
                        type="button"
                        className={`database-tab ${
                            activeTab === "all"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            changeSearchTab("all")
                        }
                    >
                        ALL
                    </button>

                    <button
                        type="button"
                        className={`database-tab ${
                            activeTab === "local"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            changeSearchTab("local")
                        }
                    >
                        LOCAL ARCHIVE
                    </button>

                    <button
                        type="button"
                        className={`database-tab ${
                            activeTab === "external"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            changeSearchTab(
                                "external"
                            )
                        }
                    >
                        OPENALEX
                    </button>
                </div>

                    <div className="database-topbar-right">

                        <div className="database-searchbar">
                            <button
                                type="button"
                                className="database-search-submit"
                                onClick={submitSearch}
                                aria-label="Search"
                                title="Search"
                            >
                                <FiSearch className="database-search-icon" />
                            </button>

                            <input
                                type="text"
                                placeholder={
                                    activeTab === "external"
                                        ? "Search OpenAlex papers..."
                                        : "Search articles, books, images..."
                                }
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter"
                                    ) {
                                        submitSearch();
                                    }

                                    if (
                                        event.key === "Escape"
                                    ) {
                                        setSearchTerm("");
                                        setSubmittedSearchTerm(
                                            ""
                                        );
                                    }
                                }}
                            />
                        </div>

                        <button
                            className="database-close-btn"
                            onClick={onClose}
                        >
                            ×
                        </button>

                    </div>

                </div>

                <div className="database-content">

                    <aside className="database-filter-panel">

                        <h3>FILTERS</h3>

                        <div className="database-filter-section">
                            <p className="filter-title">Source</p>

                            <div className="filter-tags">
                                {sourceOptions.map((source) => (
                                    <button
                                        key={source}
                                        className={`filter-tag ${selectedSources.includes(source) ? "active" : ""}`}
                                        onClick={() => toggleFilter(source, selectedSources, setSelectedSources)}
                                    >
                                        {formatLabel(source)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="database-filter-section">
                            <p className="filter-title">Content type</p>

                            <div className="filter-tags">
                                {contentTypeOptions.map((type) => (
                                    <button
                                        key={type}
                                        className={`filter-tag ${selectedContentTypes.includes(type) ? "active" : ""}`}
                                        onClick={() => toggleFilter(type, selectedContentTypes, setSelectedContentTypes)}
                                    >
                                        {formatLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="database-filter-section">
                            <p className="filter-title">Year</p>

                            <div className="year-inputs">
                                <input
                                    placeholder="FROM"
                                    value={yearFrom}
                                    onChange={(e) => setYearFrom(e.target.value)}
                                />

                                <input
                                    placeholder="TO"
                                    value={yearTo}
                                    onChange={(e) => setYearTo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="database-filter-section">
                            <p className="filter-title">Language</p>

                            <div className="filter-tags">
                                {languageOptions.map((language) => (
                                    <button
                                        key={language}
                                        className={`filter-tag ${selectedLanguages.includes(language) ? "active" : ""}`}
                                        onClick={() => toggleFilter(language, selectedLanguages, setSelectedLanguages)}
                                    >
                                        {formatLabel(language)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="database-filter-section">
                            <p className="filter-title">Access</p>

                            <div className="filter-tags">
                                {accessTypeOptions.map((access) => (
                                    <button
                                        key={access}
                                        className={`filter-tag ${selectedAccessTypes.includes(access) ? "active" : ""}`}
                                        onClick={() => toggleFilter(access, selectedAccessTypes, setSelectedAccessTypes)}
                                    >
                                        {formatLabel(access)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="database-filter-section">
                            <p className="filter-title">Tags</p>

                            <div className="filter-tags">
                                {tagOptions.map((tag) => (
                                    <button
                                        key={tag}
                                        className={`filter-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                                        onClick={() => toggleFilter(tag, selectedTags, setSelectedTags)}
                                    >
                                        {formatLabel(tag)}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </aside>

                    <section className="database-results-panel">
                        <div className="database-results-header">
                            {isSearching
                                ? "Searching..."
                                : `${docs.length} result${
                                    docs.length === 1
                                        ? ""
                                        : "s"
                                } • ${
                                    activeTab === "external"
                                        ? "OpenAlex"
                                        : activeTab === "local"
                                            ? "Local Archive"
                                            : "Local + OpenAlex"
                                }`}
                        </div>

                        <div className="database-results-scroll">
                            {searchError && (
                                <div className="database-search-state error">
                                    {searchError}
                                </div>
                            )}

                            {!isSearching &&
                            !searchError &&
                            docs.length === 0 && (
                                <div className="database-search-state">
                                    {activeTab ===
                                        "external" &&
                                    submittedSearchTerm.length <
                                        2
                                        ? "Enter at least 2 characters and press Enter to search OpenAlex."
                                        : "No results found."}
                                </div>
                            )}

                            {docs.map((doc, index) => (
                                <div
                                className={`database-result-card ${
                                    selectedDoc?.id === doc.id ? "selected-card" : ""
                                }`}
                                key={index}
                                onClick={() => setSelectedDoc(doc)}
                                >
                                    <h2>{doc.title}</h2>

                                    <p className="database-meta">
                                        {[
                                            doc.authors,
                                            doc.journal_or_platform,
                                            doc.publication_year,
                                            doc.source,
                                        ]
                                            .filter(Boolean)
                                            .join(" • ") ||
                                            "No publication metadata"}
                                    </p>

                                    <p className="database-description">
                                        {doc.description}
                                    </p>

                                    <div className="database-keywords">
                                        {doc.tags && doc.tags.length > 0 ? (
                                            doc.tags.map((tag) => (
                                                <span key={tag}>{formatLabel(tag)}</span>
                                            ))
                                        ) : (
                                            <span>Other</span>
                                        )}
                                    </div>

                                    <div className="database-actions">
                                        <button>Add to Archive</button>
                                        <button
                                            className={sentDocId === doc.id ? "send-board-btn sent" : "send-board-btn"}
                                            onClick={(event) => {
                                                event.stopPropagation();

                                                if (onSendToBoard) {
                                                    onSendToBoard(doc);
                                                }

                                                setSentDocId(doc.id);

                                                setTimeout(() => {
                                                    setSentDocId(null);
                                                }, 1200);
                                            }}
                                        >
                                            {sentDocId === doc.id ? "Added ✓" : "Send to Board"}
                                        </button>
                                        {(doc.source_url ||
                                        doc.file_url) && (
                                            <a
                                                href={
                                                    doc.source_url ||
                                                    doc.file_url
                                                }
                                                className="database-open-source"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <CiShare1 />
                                                Open source
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="database-preview-panel">

                        {selectedDoc ? (

                            <div className="preview-content">

                                <div className="preview-header">
                                    <h2>{selectedDoc.title}</h2>

                                    <p>
                                        {selectedDoc.authors} •
                                        {" "}
                                        {selectedDoc.journal_or_platform} •
                                        {" "}
                                        {selectedDoc.publication_year}
                                    </p>
                                </div>

                                {selectedDoc.is_external ? (
                                    <div className="openalex-preview">
                                        <p className="openalex-preview-label">
                                            ABSTRACT
                                        </p>

                                        <p className="openalex-preview-abstract">
                                            {selectedDoc.description ||
                                                "No abstract is available."}
                                        </p>

                                        <div className="openalex-preview-meta">
                                            {selectedDoc.doi && (
                                                <p>
                                                    <strong>DOI:</strong>{" "}
                                                    {selectedDoc.doi}
                                                </p>
                                            )}

                                            <p>
                                                <strong>Citations:</strong>{" "}
                                                {selectedDoc.cited_by_count ??
                                                    0}
                                            </p>

                                            <p>
                                                <strong>Access:</strong>{" "}
                                                {selectedDoc.access_type ===
                                                "open_access"
                                                    ? `Open access${
                                                        selectedDoc.oa_status
                                                            ? ` · ${selectedDoc.oa_status}`
                                                            : ""
                                                    }`
                                                    : "Metadata only"}
                                            </p>

                                            {selectedDoc.language && (
                                                <p>
                                                    <strong>Language:</strong>{" "}
                                                    {selectedDoc.language}
                                                </p>
                                            )}
                                        </div>

                                        <div className="openalex-preview-actions">
                                            {selectedDoc.source_url && (
                                                <a
                                                    href={
                                                        selectedDoc.source_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <CiShare1 />
                                                    Open publication
                                                </a>
                                            )}

                                            {selectedDoc.file_url && (
                                                <a
                                                    href={
                                                        selectedDoc.file_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Open PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <iframe
                                        src={
                                            selectedDoc.file_url ||
                                            selectedDoc.source_url
                                        }
                                        title={
                                            selectedDoc.title
                                        }
                                        className="document-preview"
                                    />
                                )}

                            </div>

                        ) : (

                            <div className="preview-placeholder">
                                Select a result to preview
                            </div>

                        )}

                    </section>

                </div>

            </div>
        </div>
    );
}

export default DatabaseSearch;