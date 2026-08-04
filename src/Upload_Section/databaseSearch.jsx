import "./databaseSearch.css";
import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
//import { supabase } from "../lib/supabase";
import { CiShare1 } from "react-icons/ci";
import { apiRequest } from "../api";

const createEmptyFilterState = () => ({
    sources: [],
    contentTypes: [],
    languages: [],
    accessTypes: [],
    tags: [],
});


const OPENALEX_LANGUAGE_LABELS = {
    en: "English",
    zh: "Chinese",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ar: "Arabic",
    fa: "Persian",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    tr: "Turkish",
};

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

    const [
        localFilterOptions,
        setLocalFilterOptions,
    ] = useState(createEmptyFilterState);
    
    const [
        openAlexFilterOptions,
        setOpenAlexFilterOptions,
    ] = useState(createEmptyFilterState);
    
    
    const [
        selectedLocalFilters,
        setSelectedLocalFilters,
    ] = useState(createEmptyFilterState);
    
    const [
        selectedOpenAlexFilters,
        setSelectedOpenAlexFilters,
    ] = useState(createEmptyFilterState);

    /***************************************************************************/
    /** This function loads all available filter options from the documents table */
    async function fetchLocalFilterOptions() {
        try {
            const data =
                await apiRequest(
                    "/documents/filters"
                );
    
            setLocalFilterOptions({
                sources:
                    data.sources || [],
    
                contentTypes:
                    data.contentTypes || [],
    
                languages:
                    data.languages || [],
    
                accessTypes:
                    data.accessTypes || [],
    
                tags:
                    data.tags || [],
            });
        } catch (error) {
            console.error(
                "Failed to fetch local filter options:",
                error
            );
        }
    }

    /***************************************************************************/
    /** This effect loads filter options from database when the popup opens */
    useEffect(() => {
        if (showModal) {
            fetchLocalFilterOptions();
        }
    }, [showModal]);

    const getTopFilterValues = (
        values,
        limit = 30
    ) => {
        const counts = new Map();
    
        values
            .filter(Boolean)
            .map((value) =>
                String(value).trim()
            )
            .filter(Boolean)
            .forEach((value) => {
                counts.set(
                    value,
                    (counts.get(value) || 0) + 1
                );
            });
    
        return [...counts.entries()]
            .sort(
                (
                    [valueA, countA],
                    [valueB, countB]
                ) => {
                    if (countB !== countA) {
                        return countB - countA;
                    }
    
                    return valueA.localeCompare(
                        valueB
                    );
                }
            )
            .slice(0, limit)
            .map(([value]) => value);
    };
    
    
    const getOpenAlexAccessValues = (
        doc
    ) => {
        const values = new Set();
    
        if (doc.access_type) {
            values.add(doc.access_type);
        }
    
        if (
            doc.access_type ===
            "open_access"
        ) {
            values.add("open_access");
        }
    
        if (doc.file_url) {
            values.add("full_text");
        }
    
        const description = String(
            doc.description || ""
        ).trim();
    
        if (
            description &&
            !description.startsWith(
                "No abstract"
            )
        ) {
            values.add("abstract_only");
        }
    
        return [...values];
    };
    
    
    const buildOpenAlexFilterOptions = (
        openAlexDocuments
    ) => {
        return {
            /*
              For OpenAlex, "Source" means the journal,
              conference, repository or publishing platform.
            */
            sources: getTopFilterValues(
                openAlexDocuments.map(
                    (doc) =>
                        doc.journal_or_platform ||
                        doc.source
                ),
                25
            ),
    
            contentTypes:
                getTopFilterValues(
                    openAlexDocuments.map(
                        (doc) =>
                            doc.content_type
                    ),
                    20
                ),
    
            languages:
                getTopFilterValues(
                    openAlexDocuments.map(
                        (doc) =>
                            doc.language
                    ),
                    20
                ),
    
            accessTypes:
                getTopFilterValues(
                    openAlexDocuments.flatMap(
                        getOpenAlexAccessValues
                    ),
                    10
                ),
    
            /*
              OpenAlex tags come from the Topics attached
              to the returned Works.
            */
            tags: getTopFilterValues(
                openAlexDocuments.flatMap(
                    (doc) =>
                        Array.isArray(doc.tags)
                            ? doc.tags
                            : []
                ),
                30
            ),
        };
    };

    const matchesOneSelectedValue = (
        selectedValues,
        value
    ) => {
        return (
            selectedValues.length === 0 ||
            selectedValues.includes(value)
        );
    };
    
    
    const filterOpenAlexDocuments = (
        openAlexDocuments,
        filters
    ) => {
        return openAlexDocuments.filter(
            (doc) => {
                const source =
                    doc.journal_or_platform ||
                    doc.source ||
                    "";
    
                const contentType =
                    doc.content_type || "";
    
                const language =
                    doc.language || "";
    
                const docTags =
                    Array.isArray(doc.tags)
                        ? doc.tags
                        : [];
    
                const docAccessValues =
                    getOpenAlexAccessValues(doc);
    
                const sourceMatches =
                    matchesOneSelectedValue(
                        filters.sources,
                        source
                    );
    
                const contentTypeMatches =
                    matchesOneSelectedValue(
                        filters.contentTypes,
                        contentType
                    );
    
                const languageMatches =
                    matchesOneSelectedValue(
                        filters.languages,
                        language
                    );
    
                /*
                  Multiple selected Access options use OR logic.
                */
                const accessMatches =
                    filters.accessTypes.length ===
                        0 ||
                    filters.accessTypes.some(
                        (value) =>
                            docAccessValues.includes(
                                value
                            )
                    );
    
                /*
                  Match the Local Archive behavior:
                  multiple Tags use OR / overlap logic.
                */
                const tagsMatch =
                    filters.tags.length === 0 ||
                    filters.tags.some(
                        (tag) =>
                            docTags.includes(tag)
                    );
    
                return (
                    sourceMatches &&
                    contentTypeMatches &&
                    languageMatches &&
                    accessMatches &&
                    tagsMatch
                );
            }
        );
    };

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
            selectedLocalFilters.sources
                .length > 0
        ) {
            params.append(
                "sources",
                selectedLocalFilters.sources.join(
                    ","
                )
            );
        }
    
        if (
            selectedLocalFilters
                .contentTypes.length > 0
        ) {
            params.append(
                "contentTypes",
                selectedLocalFilters.contentTypes.join(
                    ","
                )
            );
        }
    
        if (
            selectedLocalFilters.languages
                .length > 0
        ) {
            params.append(
                "languages",
                selectedLocalFilters.languages.join(
                    ","
                )
            );
        }
    
        if (
            selectedLocalFilters
                .accessTypes.length > 0
        ) {
            params.append(
                "accessTypes",
                selectedLocalFilters.accessTypes.join(
                    ","
                )
            );
        }
    
        if (
            selectedLocalFilters.tags
                .length > 0
        ) {
            params.append(
                "tags",
                selectedLocalFilters.tags.join(
                    ","
                )
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
            setOpenAlexFilterOptions(
                createEmptyFilterState()
            );
    
            return [];
        }
    
        const params =
            new URLSearchParams({
                search:
                    normalizedSearch,
    
                perPage:
                    "50",
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
    
        const data = await apiRequest(
            `/documents/openalex?${params.toString()}`
        );
    
        const rawOpenAlexDocuments =
            Array.isArray(data.documents)
                ? data.documents
                : [];
    
        /*
          Generate the available Source, Type, Language,
          Access and Topic options from the raw results.
        */
        const nextOptions =
            buildOpenAlexFilterOptions(
                rawOpenAlexDocuments
            );
    
        setOpenAlexFilterOptions(
            nextOptions
        );
    
        /*
          Only apply the currently selected filters.
    
          Important:
          Do not call setSelectedOpenAlexFilters here.
          That state is already watched by useEffect.
          Updating it inside this request creates the
          repeated select/unselect loop.
        */
        return filterOpenAlexDocuments(
            rawOpenAlexDocuments,
            selectedOpenAlexFilters
        );
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
                    search.trim().length < 2
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
              Local filters affect Local documents only.
              OpenAlex filters affect OpenAlex documents only.
            */
            const localPromise =
                fetchLocalDocuments(search);
    
            const openAlexPromise =
                search.trim().length >= 2
                    ? fetchOpenAlexDocuments(
                          search
                      )
                    : Promise.resolve([]);
    
            const [
                localDocuments,
                openAlexDocuments,
            ] = await Promise.all([
                localPromise,
                openAlexPromise,
            ]);
    
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
            nextSearch !==
            submittedSearchTerm
        ) {
            setSelectedOpenAlexFilters(
                createEmptyFilterState()
            );
        }
    
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
    
        selectedLocalFilters,
        selectedOpenAlexFilters,
    
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

    function formatFilterLabel(
        value,
        filterKey
    ) {
        if (
            filterKey === "languages" &&
            OPENALEX_LANGUAGE_LABELS[value]
        ) {
            return OPENALEX_LANGUAGE_LABELS[
                value
            ];
        }
    
        return String(value || "")
            .replace(/[_-]+/g, " ")
            .replace(
                /\b\w/g,
                (character) =>
                    character.toUpperCase()
            );
    }
    
    
    const toggleProviderFilter = (
        provider,
        filterKey,
        value
    ) => {
        const setter =
            provider === "local"
                ? setSelectedLocalFilters
                : setSelectedOpenAlexFilters;
    
        setter((previousFilters) => {
            const currentValues =
                previousFilters[filterKey];
    
            const nextValues =
                currentValues.includes(value)
                    ? currentValues.filter(
                          (item) =>
                              item !== value
                      )
                    : [
                          ...currentValues,
                          value,
                      ];
    
            return {
                ...previousFilters,
                [filterKey]:
                    nextValues,
            };
        });
    };
    
    
    const clearProviderFilters = (
        provider
    ) => {
        if (provider === "local") {
            setSelectedLocalFilters(
                createEmptyFilterState()
            );
    
            return;
        }
    
        setSelectedOpenAlexFilters(
            createEmptyFilterState()
        );
    };
    
    
    const renderProviderFilterSection = (
        provider,
        filterKey,
        label,
        options,
        selectedValues
    ) => {
        return (
            <div className="database-filter-section">
                <p className="filter-title">
                    {label}
                </p>
    
                <div className="filter-tags">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <button
                                type="button"
                                key={`${provider}-${filterKey}-${option}`}
                                className={`filter-tag ${
                                    selectedValues.includes(
                                        option
                                    )
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    toggleProviderFilter(
                                        provider,
                                        filterKey,
                                        option
                                    )
                                }
                            >
                                {formatFilterLabel(
                                    option,
                                    filterKey
                                )}
                            </button>
                        ))
                    ) : (
                        <span className="database-filter-empty">
                            {provider ===
                            "openalex"
                                ? "Search online sources to load options."
                                : "No options available."}
                        </span>
                    )}
                </div>
            </div>
        );
    };
    
    
    const renderProviderFilters = (
        provider
    ) => {
        const isLocal =
            provider === "local";
    
        const options = isLocal
            ? localFilterOptions
            : openAlexFilterOptions;
    
        const selected = isLocal
            ? selectedLocalFilters
            : selectedOpenAlexFilters;
    
        return (
            <div
                className={`database-provider-filter-group ${provider}`}
            >
                <div className="database-provider-filter-header">
                    <h4>
                        {isLocal
                            ? "LOCAL ARCHIVE"
                            : "SEARCH ONLINE"}
                    </h4>
    
                    <button
                        type="button"
                        onClick={() =>
                            clearProviderFilters(
                                provider
                            )
                        }
                    >
                        Clear
                    </button>
                </div>
    
                {renderProviderFilterSection(
                    provider,
                    "sources",
                    isLocal
                        ? "Source"
                        : "Source / Journal",
                    options.sources,
                    selected.sources
                )}
    
                {renderProviderFilterSection(
                    provider,
                    "contentTypes",
                    "Content type",
                    options.contentTypes,
                    selected.contentTypes
                )}
    
                {renderProviderFilterSection(
                    provider,
                    "languages",
                    "Language",
                    options.languages,
                    selected.languages
                )}
    
                {renderProviderFilterSection(
                    provider,
                    "accessTypes",
                    "Access",
                    options.accessTypes,
                    selected.accessTypes
                )}
    
                {renderProviderFilterSection(
                    provider,
                    "tags",
                    isLocal
                        ? "Tags"
                        : "Topics",
                    options.tags,
                    selected.tags
                )}
            </div>
        );
    };

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
                        SEARCH ONLINE
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
                                        ? "Search SEARCH ONLINE papers..."
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
                            <p className="filter-title">
                                Year
                            </p>

                            <div className="year-inputs">
                                <input
                                    type="number"
                                    placeholder="FROM"
                                    value={yearFrom}
                                    onChange={(event) =>
                                        setYearFrom(
                                            event.target.value
                                        )
                                    }
                                />

                                <input
                                    type="number"
                                    placeholder="TO"
                                    value={yearTo}
                                    onChange={(event) =>
                                        setYearTo(
                                            event.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {activeTab === "all" && (
                            <>
                                {renderProviderFilters(
                                    "local"
                                )}

                                {renderProviderFilters(
                                    "openalex"
                                )}
                            </>
                        )}

                        {activeTab === "local" &&
                            renderProviderFilters(
                                "local"
                            )}

                        {activeTab === "external" &&
                            renderProviderFilters(
                                "openalex"
                            )}
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
                                        ? "SEARCH ONLINE"
                                        : activeTab === "local"
                                            ? "Local Archive"
                                            : "Local + SEARCH ONLINE"
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
                                        ? "Enter at least 2 characters and press Enter to search SEARCH ONLINE."
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