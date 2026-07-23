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
    frameworkEditorDraft,
    setFrameworkEditorDraft,

    onGenerate,
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

    return (
        <div className="Framework_Panel">
            <div className="Framework_Panel_Header">
                <div>
                    <p>RESEARCH TOOL</p>
                    <h2>
                        {step === "output" ? "Editable Framework" : "Generate Framework"}
                    </h2>
                </div>

                <button type="button" onClick={onClose}>
                    ×
                </button>
            </div>

            {step === "setup" && (
                <div className="Framework_Setup">
                    <div className="Framework_Card">
                        <p className="Framework_Label">INPUT MATERIALS</p>
                        <strong>{selectedNotes.length} selected notes</strong>
                        <span>Workspace + Cabinet</span>

                        <button type="button" className="Framework_Change_Button">
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
                        {selectedNotes.length} notes · {frameworkDetailLevel} · source-linked
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
                    <p>Organizing notes, mapping evidence, and identifying gaps.</p>
                </div>
            )}

            {step === "output" && currentFramework && (
                <div className="Framework_Output">
                    <div className="Framework_Output_Card">
                        <div className="Framework_Output_Top">
                            <div>
                                <p>FRAMEWORK V1</p>
                                <strong>Editing</strong>
                            </div>

                            <button type="button" onClick={onExpand}>
                                ↗ Expand
                            </button>
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

                        <div className="Framework_Output_Footer">
                            <span>{frameworkEditorDraft.length} characters · Saved</span>
                            <button type="button" onClick={onConvertToOutline}>
                                Convert to Outline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FrameworkPanel;