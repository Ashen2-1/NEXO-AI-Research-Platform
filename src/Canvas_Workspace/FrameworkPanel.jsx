import React from "react";
import "./FrameworkPanel.css";

function FrameworkPanel({
    step,
    selectedNotes,

    frameworkDirection,
    setFrameworkDirection,
    frameworkArgument,
    setFrameworkArgument,

    frameworkDetailLevel,
    setFrameworkDetailLevel,

    frameworkOptions,
    setFrameworkOptions,

    currentFramework,
    frameworkVersions,
    frameworkEditorDraft,
    setFrameworkEditorDraft,
    frameworkSaveStatus,
    generationError,

    refinementPrompt,
    setRefinementPrompt,
    isRefining,
    isConvertingOutline,

    onGenerate,
    onCancelGeneration,
    onCreateNew,
    onSelectVersion,
    onRefine,
    onClose,
    onExpand,
    onConvertToOutline,
}) {
    const toggleOption = (key) => {
        setFrameworkOptions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const saveStatusLabel = {
        editing: "Editing",
        saving: "Saving...",
        saved: "Saved",
        error: "Save error",
    }[frameworkSaveStatus] || "Saved";

    const handleRefineKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onRefine();
        }
    };

    return (
        <div className="Framework_Panel">
            <div className="Framework_Panel_Header">
                <div>
                    <p>RESEARCH TOOL</p>
                    <h2>
                        {step === "output" ? "Editable Framework" : "Generate Framework"}
                    </h2>
                </div>

                <button type="button" onClick={onClose} aria-label="Close Framework">
                    ×
                </button>
            </div>

            {step === "setup" && (
                <div className="Framework_Setup">
                    {generationError && (
                        <div className="Framework_Error_Banner" role="alert">
                            {generationError}
                        </div>
                    )}

                    <div className="Framework_Card">
                        <p className="Framework_Label">INPUT MATERIALS</p>
                        <strong>{selectedNotes.length} selected notes</strong>
                        <span>Workspace + Cabinet</span>

                        <button
                            type="button"
                            className="Framework_Change_Button"
                            onClick={onClose}
                        >
                            Change
                        </button>
                    </div>

                    <div className="Framework_Card">
                        <p className="Framework_Label">RESEARCH DIRECTION · OPTIONAL</p>

                        <textarea
                            value={frameworkDirection}
                            onChange={(event) => setFrameworkDirection(event.target.value)}
                            placeholder="What question are you exploring?"
                        />

                        <textarea
                            value={frameworkArgument}
                            onChange={(event) => setFrameworkArgument(event.target.value)}
                            placeholder="Add an initial argument, or leave blank for AI."
                        />

                        <p className="Framework_Hint">
                            ✦ Leave blank and AI will propose these in the framework.
                        </p>
                    </div>

                    <div className="Framework_Card">
                        <p className="Framework_Label">OUTPUT SETTINGS</p>

                        <div className="Framework_Segmented">
                            <button
                                type="button"
                                className={frameworkDetailLevel === "overview" ? "Active" : ""}
                                onClick={() => setFrameworkDetailLevel("overview")}
                            >
                                Overview
                            </button>

                            <button
                                type="button"
                                className={frameworkDetailLevel === "detailed" ? "Active" : ""}
                                onClick={() => setFrameworkDetailLevel("detailed")}
                            >
                                Detailed
                            </button>
                        </div>

                        <div className="Framework_Option_Grid">
                            <button
                                type="button"
                                className={frameworkOptions.theoryConcepts ? "Active" : ""}
                                onClick={() => toggleOption("theoryConcepts")}
                            >
                                Theory & concepts
                            </button>

                            <button
                                type="button"
                                className={frameworkOptions.claimsEvidence ? "Active" : ""}
                                onClick={() => toggleOption("claimsEvidence")}
                            >
                                Claims & evidence
                            </button>

                            <button
                                type="button"
                                className={frameworkOptions.caseStudies ? "Active" : ""}
                                onClick={() => toggleOption("caseStudies")}
                            >
                                Case studies
                            </button>

                            <button
                                type="button"
                                className={frameworkOptions.researchGaps ? "Active" : ""}
                                onClick={() => toggleOption("researchGaps")}
                            >
                                Research gaps
                            </button>

                            <button
                                type="button"
                                className={frameworkOptions.originalContribution ? "Active" : ""}
                                onClick={() => toggleOption("originalContribution")}
                            >
                                Original contribution
                            </button>
                        </div>

                        <label className="Framework_Toggle_Row">
                            <span>Link claims to sources</span>
                            <input
                                type="checkbox"
                                checked={frameworkOptions.linkClaimsToSources}
                                onChange={() => toggleOption("linkClaimsToSources")}
                            />
                        </label>
                    </div>

                    <div className="Framework_Footer_Summary">
                        {selectedNotes.length} notes · {frameworkDetailLevel} · {frameworkOptions.linkClaimsToSources ? "source-linked" : "no source links"}
                    </div>

                    <button
                        type="button"
                        className="Framework_Primary_Button"
                        onClick={onGenerate}
                        disabled={selectedNotes.length === 0}
                    >
                        Generate Framework
                    </button>
                </div>
            )}

            {step === "generating" && (
                <div className="Framework_Generating">
                    <div className="Framework_Loading_Dot"></div>
                    <h3>Generating Framework...</h3>
                    <p>
                        Reading each selected source, mapping evidence, and identifying gaps.
                    </p>
                    <button
                        type="button"
                        className="Framework_Secondary_Button"
                        onClick={onCancelGeneration}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {step === "output" && currentFramework && (
                <div className="Framework_Output">
                    {generationError && (
                        <div className="Framework_Error_Banner" role="alert">
                            {generationError}
                        </div>
                    )}

                    <div className="Framework_Output_Card">
                        <div className="Framework_Output_Top">
                            <div>
                                <p>{currentFramework.title}</p>
                                <strong>{saveStatusLabel}</strong>
                            </div>

                            <div className="Framework_Output_Actions">
                                <button type="button" onClick={onCreateNew}>
                                    + New
                                </button>
                                <button type="button" onClick={onExpand}>
                                    ↗ Expand
                                </button>
                            </div>
                        </div>

                        {frameworkVersions.length > 0 && (
                            <label className="Framework_Version_Row">
                                <span>Version history</span>
                                <select
                                    value={currentFramework.id || ""}
                                    onChange={(event) => onSelectVersion(event.target.value)}
                                >
                                    {!currentFramework.id && (
                                        <option value="">Unsaved version</option>
                                    )}
                                    {frameworkVersions.map((framework) => (
                                        <option key={framework.id} value={framework.id}>
                                            {framework.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <div className="Framework_Source_Summary">
                            {(currentFramework.sources || []).map((source) => (
                                <span key={source.id}>{source.title}</span>
                            ))}
                        </div>

                        <div className="Framework_Mini_Toolbar">
                            <button type="button">Paragraph</button>
                            <button type="button"><b>B</b></button>
                            <button type="button"><i>I</i></button>
                            <button type="button">•</button>
                            <button type="button">↶</button>
                        </div>

                        <textarea
                            className="Framework_Editor_Textarea"
                            value={frameworkEditorDraft}
                            onChange={(event) => setFrameworkEditorDraft(event.target.value)}
                        />

                        <div className="Framework_Refine_Box">
                            <p className="Framework_Label">REFINE WITH AI</p>
                            <div className="Framework_Refine_Row">
                                <input
                                    type="text"
                                    value={refinementPrompt}
                                    onChange={(event) => setRefinementPrompt(event.target.value)}
                                    onKeyDown={handleRefineKeyDown}
                                    placeholder="Example: strengthen section 2 and mark unsupported claims"
                                    disabled={isRefining}
                                />
                                <button
                                    type="button"
                                    onClick={onRefine}
                                    disabled={isRefining || !refinementPrompt.trim()}
                                >
                                    {isRefining ? "Revising..." : "Apply"}
                                </button>
                            </div>
                        </div>

                        <div className="Framework_Output_Footer">
                            <span>
                                {frameworkEditorDraft.length} characters · {saveStatusLabel}
                            </span>
                            <button
                                type="button"
                                onClick={onConvertToOutline}
                                disabled={isConvertingOutline}
                            >
                                {isConvertingOutline
                                    ? "Converting..."
                                    : "Convert to Outline"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FrameworkPanel;
