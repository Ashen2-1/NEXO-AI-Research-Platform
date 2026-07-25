import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const getFastApiBaseUrl = () => {
    const configuredUrl = process.env.FASTAPI_BASE_URL?.trim();

    // The existing local AI service in this project normally runs on port 8000.
    // An environment value, when present, still takes priority.
    return (configuredUrl || "http://127.0.0.1:8000").replace(/\/+$/, "");
};

const buildFastApiHeaders = () => {
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    const apiKey = process.env.FASTAPI_API_KEY?.trim();

    // Do not send an "undefined" key. Local FastAPI setups that do not require
    // an API key can therefore work without adding a new .env value.
    if (apiKey) {
        headers["X-API-Key"] = apiKey;
    }

    return headers;
};

const parseUpstreamResponse = async (response) => {
    const responseText = await response.text();

    if (!responseText) {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return {
            detail: responseText.replace(/\s+/g, " ").slice(0, 500),
        };
    }
};

router.post("/query-text", authMiddleware, async (req, res) => {
    const {
        question,
        top_k = 3,
        source_filter = "",
        use_rag = false,
        chat_history = [],
    } = req.body;

    const shouldUseRag = use_rag === true || use_rag === "true";

    if (!question || !question.trim()) {
        return res.status(400).json({
            error: "Question is required.",
        });
    }

    const formData = new URLSearchParams();
    formData.append("question", question);
    formData.append("chat_history", JSON.stringify(chat_history));

    let endpoint = "/query/general";

    if (shouldUseRag) {
        endpoint = "/query/text";
        formData.append("top_k", String(top_k));

        if (source_filter) {
            formData.append("source_filter", source_filter);
        }
    }

    const fastApiBaseUrl = getFastApiBaseUrl();
    const targetUrl = `${fastApiBaseUrl}${endpoint}`;

    console.log("AI ROUTE DEBUG:", {
        shouldUseRag,
        endpoint,
        sourceFilter: source_filter || null,
        historyCount: Array.isArray(chat_history) ? chat_history.length : 0,
        targetUrl,
    });

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: buildFastApiHeaders(),
            body: formData.toString(),
        });

        const data = await parseUpstreamResponse(response);

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data.detail ||
                    data.error ||
                    `AI service returned status ${response.status}.`,
            });
        }

        return res.json({
            answer: data.answer,
            sources: data.sources || [],
            mode: data.mode,
            question: data.question,
        });
    } catch (error) {
        console.error("AI query error:", error);

        return res.status(502).json({
            error:
                `Could not reach the AI service at ${fastApiBaseUrl}. ` +
                "Start the existing FastAPI service or set FASTAPI_BASE_URL to its address.",
        });
    }
});

export default router;
