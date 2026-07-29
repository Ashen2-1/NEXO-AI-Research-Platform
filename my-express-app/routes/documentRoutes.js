import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const rebuildOpenAlexAbstract = (
    invertedIndex
) => {
    if (
        !invertedIndex ||
        typeof invertedIndex !== "object"
    ) {
        return "";
    }

    const words = [];

    for (const [
        word,
        positions,
    ] of Object.entries(invertedIndex)) {
        if (!Array.isArray(positions)) {
            continue;
        }

        for (const position of positions) {
            words[position] = word;
        }
    }

    return words
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
};


const normalizeOpenAlexType = (
    value
) => {
    const aliases = {
        article: "article",

        book: "book",
        book_catalog: "book",

        dataset: "dataset",

        preprint: "preprint",

        dissertation:
            "dissertation",

        thesis_report:
            "dissertation",

        book_chapter:
            "book-chapter",

        "book-chapter":
            "book-chapter",
    };

    const normalized = String(
        value || ""
    )
        .trim()
        .toLowerCase();

    return aliases[normalized] || "";
};


const normalizeOpenAlexLanguage = (
    value
) => {
    const aliases = {
        english: "en",
        chinese: "zh",
        french: "fr",
        german: "de",
        spanish: "es",
        italian: "it",
        portuguese: "pt",
        arabic: "ar",
        persian: "fa",
        russian: "ru",
        japanese: "ja",
        korean: "ko",
        turkish: "tr",
    };

    const normalized = String(
        value || ""
    )
        .trim()
        .toLowerCase();

    if (/^[a-z]{2}$/.test(normalized)) {
        return normalized;
    }

    return aliases[normalized] || "";
};

router.get("/", authMiddleware, async (req, res) => {
    const {
        search = "",
        sources = "",
        contentTypes = "",
        languages = "",
        accessTypes = "",
        tags = "",
        yearFrom = "",
        yearTo = "",
    } = req.query;

    try {
         let sql = `
            select *
            from public.documents
            where 1 = 1
        `;

        const values = [];

        if (search.trim() !== "") {
            values.push(`%${search}%`);
            sql += ` and title ilike $${values.length}`;
        }

        if (sources.trim() !== "") {
            values.push(sources.split(","));
            sql += ` and source = any($${values.length})`;
        }

        if (contentTypes.trim() !== "") {
            values.push(contentTypes.split(","));
            sql += ` and content_type = any($${values.length})`;
        }

        if (languages.trim() !== "") {
            values.push(languages.split(","));
            sql += ` and language = any($${values.length})`;
        }

        if (accessTypes.trim() !== "") {
            values.push(accessTypes.split(","));
            sql += ` and access_type = any($${values.length})`;
        }

        if (tags.trim() !== "") {
            values.push(tags.split(","));
            sql += ` and tags && $${values.length}::text[]`;
        }

        if (yearFrom.trim() !== "") {
            values.push(Number(yearFrom));
            sql += ` and publication_year >= $${values.length}`;
        }

        if (yearTo.trim() !== "") {
            values.push(Number(yearTo));
            sql += ` and publication_year <= $${values.length}`;
        }

        sql += ` order by created_at desc`;

        const result = await pool.query(sql, values);

        res.json({
            documents: result.rows,
        });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({
            error: "Server error while getting documents.",
        });
    }
});

router.get(
    "/openalex",
    authMiddleware,
    async (req, res) => {
        const search = String(
            req.query.search || ""
        ).trim();

        const yearFrom = String(
            req.query.yearFrom || ""
        ).trim();

        const yearTo = String(
            req.query.yearTo || ""
        ).trim();

        const contentTypes = String(
            req.query.contentTypes || ""
        ).trim();

        const languages = String(
            req.query.languages || ""
        ).trim();

        const accessTypes = String(
            req.query.accessTypes || ""
        ).trim();

        const requestedPerPage =
            Number.parseInt(
                req.query.perPage,
                10
            );

        const perPage = Math.min(
            Math.max(
                Number.isFinite(
                    requestedPerPage
                )
                    ? requestedPerPage
                    : 20,
                1
            ),
            50
        );

        if (search.length < 2) {
            return res.status(400).json({
                error:
                    "Enter at least 2 characters to search OpenAlex.",
            });
        }

        const apiKey = String(
            process.env
                .OPENALEX_API_KEY || ""
        ).trim();

        if (!apiKey) {
            return res.status(503).json({
                error:
                    "OPENALEX_API_KEY is not configured on the backend.",
            });
        }

        const filters = [];

        if (
            /^\d{4}$/.test(yearFrom)
        ) {
            filters.push(
                `from_publication_date:${yearFrom}-01-01`
            );
        }

        if (
            /^\d{4}$/.test(yearTo)
        ) {
            filters.push(
                `to_publication_date:${yearTo}-12-31`
            );
        }

        if (contentTypes) {
            const normalizedTypes =
                contentTypes
                    .split(",")
                    .map(
                        normalizeOpenAlexType
                    )
                    .filter(Boolean);

            if (
                normalizedTypes.length > 0
            ) {
                filters.push(
                    `type:${[
                        ...new Set(
                            normalizedTypes
                        ),
                    ].join("|")}`
                );
            }
        }

        if (languages) {
            const normalizedLanguages =
                languages
                    .split(",")
                    .map(
                        normalizeOpenAlexLanguage
                    )
                    .filter(Boolean);

            if (
                normalizedLanguages.length >
                0
            ) {
                filters.push(
                    `language:${[
                        ...new Set(
                            normalizedLanguages
                        ),
                    ].join("|")}`
                );
            }
        }

        if (accessTypes) {
            const accessValues =
                accessTypes
                    .split(",")
                    .map((value) =>
                        value
                            .trim()
                            .toLowerCase()
                    );

            if (
                accessValues.includes(
                    "open_access"
                )
            ) {
                filters.push(
                    "open_access.is_oa:true"
                );
            }

            if (
                accessValues.includes(
                    "full_text"
                )
            ) {
                filters.push(
                    "has_fulltext:true"
                );
            }

            if (
                accessValues.includes(
                    "abstract_only"
                ) &&
                !accessValues.includes(
                    "full_text"
                )
            ) {
                filters.push(
                    "has_abstract:true"
                );
            }
        }

        const params =
            new URLSearchParams({
                search,
                per_page:
                    String(perPage),

                api_key:
                    apiKey,

                select: [
                    "id",
                    "doi",
                    "title",
                    "display_name",
                    "publication_year",
                    "publication_date",
                    "type",
                    "language",
                    "cited_by_count",
                    "authorships",
                    "primary_location",
                    "best_oa_location",
                    "open_access",
                    "abstract_inverted_index",
                    "topics",
                ].join(","),
            });

        if (filters.length > 0) {
            params.set(
                "filter",
                filters.join(",")
            );
        }

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(() => {
                controller.abort();
            }, 15000);

        try {
            const response = await fetch(
                `https://api.openalex.org/works?${params.toString()}`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",
                    },

                    signal:
                        controller.signal,
                }
            );

            const responseText =
                await response.text();

            let data = {};

            try {
                data = responseText
                    ? JSON.parse(
                          responseText
                      )
                    : {};
            } catch {
                data = {};
            }

            if (!response.ok) {
                return res
                    .status(response.status)
                    .json({
                        error:
                            data.message ||
                            data.error ||
                            `OpenAlex request failed with status ${response.status}.`,
                    });
            }

            const works =
                Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];

            const documents =
                works.map((work) => {
                    const authors =
                        Array.isArray(
                            work.authorships
                        )
                            ? work.authorships
                                  .map(
                                      (
                                          authorship
                                      ) =>
                                          authorship
                                              .author
                                              ?.display_name
                                  )
                                  .filter(
                                      Boolean
                                  )
                                  .join(", ")
                            : "";

                    const journal =
                        work
                            .primary_location
                            ?.source
                            ?.display_name ||
                        "OpenAlex";

                    const abstract =
                        rebuildOpenAlexAbstract(
                            work.abstract_inverted_index
                        );

                    const tags =
                        Array.isArray(
                            work.topics
                        )
                            ? work.topics
                                  .slice(0, 5)
                                  .map(
                                      (
                                          topic
                                      ) =>
                                          topic.display_name
                                  )
                                  .filter(
                                      Boolean
                                  )
                            : [];

                    const publicationUrl =
                        work
                            .primary_location
                            ?.landing_page_url ||
                        work.doi ||
                        work.id ||
                        "";

                    const pdfUrl =
                        work
                            .best_oa_location
                            ?.pdf_url ||
                        work
                            .primary_location
                            ?.pdf_url ||
                        "";

                    return {
                        id:
                            work.id,

                        openalex_id:
                            work.id,

                        doi:
                            work.doi ||
                            "",

                        title:
                            work.display_name ||
                            work.title ||
                            "Untitled Work",

                        authors,

                        journal_or_platform:
                            journal,

                        publication_year:
                            work.publication_year ||
                            null,

                        publication_date:
                            work.publication_date ||
                            null,

                        description:
                            abstract ||
                            "No abstract is available from OpenAlex.",

                        tags,

                        source:
                            "OpenAlex",

                        content_type:
                            work.type ||
                            "article",

                        language:
                            work.language ||
                            "",

                        access_type:
                            work.open_access
                                ?.is_oa
                                ? "open_access"
                                : "metadata_only",

                        oa_status:
                            work.open_access
                                ?.oa_status ||
                            "",

                        cited_by_count:
                            work.cited_by_count ||
                            0,

                        source_url:
                            publicationUrl,

                        file_url:
                            pdfUrl,

                        is_external:
                            true,

                        external_provider:
                            "OpenAlex",
                    };
                });

            return res.json({
                documents,

                provider:
                    "OpenAlex",

                total:
                    data.meta?.count ??
                    documents.length,
            });
        } catch (error) {
            console.error(
                "OpenAlex search error:",
                error
            );

            if (
                error.name ===
                "AbortError"
            ) {
                return res
                    .status(504)
                    .json({
                        error:
                            "OpenAlex search timed out.",
                    });
            }

            return res
                .status(500)
                .json({
                    error:
                        "Server error while searching OpenAlex.",
                });
        } finally {
            clearTimeout(timeoutId);
        }
    }
);

router.get("/filters", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            select source, content_type, language, access_type, tags
            from public.documents
        `);

        const docs = result.rows;

        const sources = [...new Set(docs.map((doc) => doc.source).filter(Boolean))];
        const contentTypes = [...new Set(docs.map((doc) => doc.content_type).filter(Boolean))];
        const languages = [...new Set(docs.map((doc) => doc.language).filter(Boolean))];
        const accessTypes = [...new Set(docs.map((doc) => doc.access_type).filter(Boolean))];

        const allTags = docs.flatMap((doc) => doc.tags || []);
        const tagOptions = [...new Set(allTags.filter(Boolean))];

        res.json({
            sources,
            contentTypes,
            languages,
            accessTypes,
            tags: tagOptions,
        });
    } catch (error) {
        console.error("Get document filters error:", error);
        res.status(500).json({
            error: "Server error while getting document filters.",
        });
    }
});

export default router;