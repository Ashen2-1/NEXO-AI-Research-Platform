import React from "react";
import "./Header.css";

function Header({
    activeToolMode,
    setActiveToolMode,

    projectName = "ARTSCOPE",
    projectSubtitle = "Photography and Evidence",
    saveStatus = "Saved",

    onUndo,
    onRedo,
    onSelectTool,
    onDeleteSelected,
    onPanTool,
    onCreateNote,
    onLinkSelected,
    onUpload,
    onCluster,
    onAutoArrange,
    onLockSelected,
    onPinTop,

    onSearchSources,
    onAskOnly,
    onSummary,
    onCompare,
    onFindEvidence,
    onFindGaps,
    onFramework,
    onOutline,

    onSave,
    onExport,
    onShare,
    onSettings,
}) {
    const isCanvasMode = activeToolMode === "canvas";
    const isResearchMode = activeToolMode === "research";

    return (
        <header className="App_Header">
            <div className="Header_Inner">
                <div className="Header_Top_Row">
                    <div className="Header_Brand_Area">
                        <div className="Header_Project_Block">
                            <h1>{projectName}</h1>
                            <span>{projectSubtitle}</span>
                            <p>{saveStatus}</p>
                        </div>
                    </div>

                    <div className="Header_Mode_Switch">
                        <button
                            type="button"
                            className={isCanvasMode ? "Header_Mode_Button Active" : "Header_Mode_Button"}
                            onClick={() => setActiveToolMode("canvas")}
                        >
                            Canvas Tools
                        </button>

                        <button
                            type="button"
                            className={isResearchMode ? "Header_Mode_Button Active" : "Header_Mode_Button"}
                            onClick={() => setActiveToolMode("research")}
                        >
                            Research Tools
                        </button>
                    </div>

                    <div className="Header_Action_Group">
                        <button type="button" onClick={onSave}>▣ Save</button>
                        <button type="button" onClick={onExport}>⇩ Export</button>
                        <button type="button" onClick={onShare}>⌘ Share</button>
                        <button type="button" onClick={onSettings}>⚙ Settings</button>
                        <button type="button" className="Header_Avatar" aria-label="User profile"></button>
                    </div>
                </div>

                <div className="Header_Tool_Row">
                    {isCanvasMode && (
                        <>
                            <button type="button" onClick={onUndo}>↶</button>
                            <button type="button" onClick={onRedo}>↷</button>

                            <div className="Header_Divider" />

                            <button type="button" onClick={onSelectTool}>⌁ Select</button>
                            <button type="button" onClick={onDeleteSelected}>🗑 Delete</button>
                            <button type="button" onClick={onPanTool}>✋ Pan</button>
                            <button type="button" onClick={onCreateNote}>▣ Notes</button>
                            <button type="button" onClick={onLinkSelected}>🔗 Link</button>
                            <button type="button" onClick={onUpload}>⇧ Upload</button>
                            <button type="button" onClick={onCluster}>□ Cluster</button>
                            <button type="button" onClick={onAutoArrange}>☷ Auto Arrange</button>
                            <button type="button" onClick={onLockSelected}>🔒 Lock</button>
                            <button type="button" onClick={onPinTop}>↗ Pin Top</button>
                        </>
                    )}

                    {isResearchMode && (
                        <>
                            <div className="Header_Search_Box">
                                <span>⌕</span>
                                <input
                                    type="text"
                                    placeholder="Search sources or notes..."
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && onSearchSources) {
                                            onSearchSources(event.currentTarget.value);
                                        }
                                    }}
                                />
                            </div>

                            <button type="button" onClick={onAskOnly}>Ask only</button>
                            <button type="button" onClick={onSummary}>▤ Summary</button>
                            <button type="button" onClick={onCompare}>↕ Compare</button>
                            <button type="button" onClick={onFindEvidence}>☑ Find Evidence</button>
                            <button type="button" onClick={onFindGaps}>☷ Find Gaps</button>
                            <button type="button" className="Research_Tool_Button Active" onClick={onFramework}>✦ Framework</button>
                            <button type="button" onClick={onOutline}>☰ Outline</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;