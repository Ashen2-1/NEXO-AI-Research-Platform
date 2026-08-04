import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const getFastApiBaseUrl = () => {
    const configuredUrl =
        process.env.FASTAPI_BASE_URL?.trim();

    return (
        configuredUrl || "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
};

const buildFastApiHeaders = () => {
    const headers = {
        "Content-Type":
            "application/x-www-form-urlencoded",
    };

    const apiKey =
        process.env.FASTAPI_API_KEY?.trim();

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

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(responseText);
    } catch {
      return {
        detail: "AI service returned invalid JSON.",
      };
    }
  }

  const looksLikeHtml =
    responseText.includes("<!DOCTYPE html") ||
    responseText.includes("<html") ||
    responseText.includes("<title>502</title>");

  if (looksLikeHtml) {
    return {
      detail:
        "AI service is temporarily unavailable. The RAG server returned an HTML error page instead of JSON.",
    };
  }

  return {
    detail: responseText.replace(/\s+/g, " ").slice(0, 500),
  };
};

const normalizeChatHistory = (history) => {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .slice(-10)
        .map((message) => {
            const role =
                message?.role === "ai" ||
                message?.role === "assistant"
                    ? "assistant"
                    : "user";

            const content = String(
                message?.content ??
                message?.text ??
                ""
            )
                .trim()
                .slice(0, 8000);

            return {
                role,
                content,
            };
        })
        .filter((message) => message.content);
};

const normalizeSourceFilters = (
    sourceFilters,
    legacySourceFilter
) => {
    let candidates = [];

    if (Array.isArray(sourceFilters)) {
        candidates = sourceFilters;
    } else if (
        typeof sourceFilters === "string" &&
        sourceFilters.trim()
    ) {
        try {
            const parsed =
                JSON.parse(sourceFilters);

            candidates = Array.isArray(parsed)
                ? parsed
                : [sourceFilters];
        } catch {
            candidates = [sourceFilters];
        }
    }

    if (
        typeof legacySourceFilter === "string" &&
        legacySourceFilter.trim()
    ) {
        candidates.push(legacySourceFilter);
    }

    return [
        ...new Set(
            candidates
                .map((source) =>
                    String(source).trim()
                )
                .filter(Boolean)
                .filter(
                    (source) =>
                        !source.startsWith("__nexo_")
                )
        ),
    ].slice(0, 20);
};

router.post(
    "/query-text",
    authMiddleware,
    async (req, res) => {
        const {
            question,
            top_k = 5,
            source_filter = "",
            source_filters = [],
            use_rag = false,
            chat_history = [],
            canvas_id = "default",
        } = req.body;

        if (
            !question ||
            !String(question).trim()
        ) {
            return res.status(400).json({
                error: "Question is required.",
            });
        }

        /*
         * 安全重点：
         * user_id 只能来自验证后的 JWT。
         * 绝对不能使用 req.body.user_id，
         * 否则用户可以伪造其他用户 ID。
         */
        const userId = String(
            req.user.id
        ).trim();

        const canvasId =
            String(canvas_id || "default")
                .trim()
                .slice(0, 200) ||
            "default";

        const shouldUseRag =
            use_rag === true ||
            use_rag === "true";

        const safeTopK = Math.max(
            1,
            Math.min(
                Number.parseInt(top_k, 10) || 3,
                10
            )
        );

        const safeChatHistory =
            normalizeChatHistory(chat_history);

        const selectedSources =
            normalizeSourceFilters(
                source_filters,
                source_filter
            );

        const formData = new URLSearchParams();

        formData.append(
            "question",
            String(question).trim()
        );

        formData.append(
            "user_id",
            userId
        );

        formData.append(
            "canvas_id",
            canvasId
        );

        formData.append(
            "chat_history",
            JSON.stringify(safeChatHistory)
        );

        let endpoint = "/query/general";

        if (shouldUseRag) {
            endpoint = "/query/text";

            formData.append(
                "top_k",
                String(safeTopK)
            );

            
            if (selectedSources.length > 0) {
                // 新接口：发送完整来源数组
                formData.append(
                    "source_filters",
                    JSON.stringify(selectedSources)
                );

                // 暂时兼容 Python 旧的单来源接口
                if (selectedSources.length === 1) {
                    formData.append(
                        "source_filter",
                        selectedSources[0]
                    );
                }
            }
        }

        const fastApiBaseUrl =
            getFastApiBaseUrl();

        const targetUrl =
            `${fastApiBaseUrl}${endpoint}`;

        console.log("AI ROUTE DEBUG:", {
            userId,
            canvasId,
            shouldUseRag,
            endpoint,
            selectedSources,
            historyCount: safeChatHistory.length,
            targetUrl,
        });

        try {
            const response = await fetch(
                targetUrl,
                {
                    method: "POST",
                    headers:
                        buildFastApiHeaders(),
                    body: formData.toString(),
                }
            );

            const data =
                await parseUpstreamResponse(
                    response
                );

            if (!response.ok) {
                return res
                    .status(response.status)
                    .json({
                        error:
                            data.detail ||
                            data.error ||
                            `AI service returned status ${response.status}.`,
                    });
            }

            return res.json({
                answer:
                    data.answer ||
                    "No answer returned.",
                sources:
                    Array.isArray(data.sources)
                        ? data.sources
                        : [],
                mode: data.mode,
                question: data.question,
            });
        } catch (error) {
            console.error(
                "AI query error:",
                error
            );

            return res.status(502).json({
                error:
                    `Could not reach the AI service at ${fastApiBaseUrl}. ` +
                    "Check FASTAPI_BASE_URL and the Python service.",
            });
        }
    }
);

export default router;