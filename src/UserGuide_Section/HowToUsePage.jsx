import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HowToUsePage.css";



const GUIDE_MEDIA = {
    build:
        "/public/assets/build-research-space.mp4",
    connect:
        "/public/assets/make-connections.mp4",
    discover:
        "/public/assets/discover-new-sources.mp4",
    conversation:
        "/public/assets/start-a-conversation.mp4",
};

const WORKFLOW_STEPS = [
    {
        number: "01",
        label: "Add materials",
    },
    {
        number: "02",
        label: "Organize ideas",
    },
    {
        number: "03",
        label: "Discover sources",
    },
    {
        number: "04",
        label: "Ask the AI",
    },
    {
        number: "05",
        label: "Develop ideas",
    },
];

const RESEARCH_TOOLS = [
    {
        number: "01",
        title: "SUMMARY",
        description:
            "Bring the main ideas from selected materials together.",
    },
    {
        number: "02",
        title: "COMPARE",
        description:
            "Place sources, arguments, or interpretations in conversation.",
    },
    {
        number: "03",
        title: "FIND EVIDENCE",
        description:
            "Identify useful material that supports a developing claim.",
    },
    {
        number: "04",
        title: "FIND GAPS",
        description:
            "Highlight missing context, evidence, or questions to pursue.",
    },
    {
        number: "05",
        title: "FRAMEWORK",
        description:
            "Shape a research approach around your selected sources.",
    },
    {
        number: "06",
        title: "OUTLINE",
        description:
            "Turn connected ideas into an initial writing structure.",
    },
];

function GuideVideo({
    src,
    label,
    className = "",
}) {
    return (
        <div
            className={[
                "Guide_Media_Frame",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <video
                className="Guide_Video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={label}
            >
                <source
                    src={src}
                    type="video/mp4"
                />
                Your browser does not support embedded video.
            </video>
        </div>
    );
}

function HowToUsePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const backTo = location.state?.backTo || "/dashboard";

    useEffect(() => {
        const previousTitle = document.title;
        document.title = "NEXO / How to Use";

        return () => {
            document.title = previousTitle;
        };
    }, []);

    const goToWorkspace = () => {
        navigate(backTo);
    };

    const scrollToWorkflow = () => {
        document
            .getElementById("guide-workflow")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    };

    return (
        <div className="Guide_Page">
            <div className="Guide_Page_Shell">
                <header className="Guide_Header">
                    <div className="Guide_Header_Bar">
                        <div className="Guide_Header_Brand">
                            <strong>NEXO</strong>
                            <span>HELP&nbsp; / &nbsp;HOW TO USE</span>
                        </div>

                        <button
                            type="button"
                            className="Guide_Button Guide_Button_Secondary"
                            onClick={goToWorkspace}
                        >
                            Back to Workspace
                            <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                </header>

                <main>
                    <section className="Guide_Hero">
                        <div className="Guide_Hero_Copy">
                            <p className="Guide_Eyebrow">
                                GETTING STARTED&nbsp; · &nbsp;5 MIN GUIDE
                            </p>

                            <h1>
                                Welcome to
                                <br />
                                NEXO.
                            </h1>

                            <p className="Guide_Lead">
                                Bring your notes, sources, ideas,
                                and AI research tools into one
                                visual workspace. Here is how to
                                get started.
                            </p>

                            <button
                                type="button"
                                className="Guide_Button Guide_Button_Primary"
                                onClick={scrollToWorkflow}
                            >
                                Explore the workflow
                                <span aria-hidden="true">↓</span>
                            </button>
                        </div>

                        {/*
                          media.zip contains four videos while the
                          reference layout has five media boxes.
                          The first video is intentionally reused here
                          as the looping hero preview and again in Step 01.
                        */}
                        <GuideVideo
                            src={GUIDE_MEDIA.build}
                            label="NEXO workspace overview"
                            className="Guide_Hero_Media"
                        />
                    </section>

                    <section
                        id="guide-workflow"
                        className="Guide_Workflow"
                    >
                        <p className="Guide_Eyebrow">
                            THE WORKFLOW
                        </p>

                        <h2>
                            One workspace. Five simple moves.
                        </h2>

                        <div className="Guide_Workflow_Scroller">
                            <div className="Guide_Workflow_Steps">
                                {WORKFLOW_STEPS.map(
                                    (step) => (
                                        <div
                                            className="Guide_Workflow_Step"
                                            key={step.number}
                                        >
                                            <span>
                                                {step.number}
                                            </span>
                                            <strong>
                                                {step.label}
                                            </strong>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </section>

                    <div className="Guide_Features">
                        <section className="Guide_Feature Guide_Feature_One">
                            <GuideVideo
                                src={GUIDE_MEDIA.build}
                                label="Create notes and upload source materials"
                            />

                            <div className="Guide_Feature_Copy">
                                <p className="Guide_Eyebrow">
                                    01&nbsp; / &nbsp;BUILD YOUR RESEARCH SPACE
                                </p>

                                <h2>
                                    Start with what you already
                                    have.
                                </h2>

                                <p>
                                    Create a note for an idea or
                                    upload a document to begin
                                    building your workspace.
                                </p>

                                <ul>
                                    <li>
                                        Select Notes to capture an
                                        observation.
                                    </li>
                                    <li>
                                        Select Upload to add a
                                        supported document.
                                    </li>
                                    <li>
                                        Find your materials in the
                                        Cabinet and on the Canvas.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section className="Guide_Feature Guide_Feature_Two">
                            <div className="Guide_Feature_Copy">
                                <p className="Guide_Eyebrow">
                                    02&nbsp; / &nbsp;MAKE CONNECTIONS
                                </p>

                                <h2>
                                    Turn the Canvas into a thinking
                                    surface.
                                </h2>

                                <p>
                                    Move materials around as your
                                    argument develops. The layout can
                                    become part of how you think.
                                </p>

                                <ul>
                                    <li>
                                        Click a note to select it.
                                    </li>
                                    <li>
                                        Drag notes to arrange them
                                        visually.
                                    </li>
                                    <li>
                                        Use Link to connect related
                                        ideas.
                                    </li>
                                    <li>
                                        Use Cluster to group materials
                                        by theme.
                                    </li>
                                </ul>
                            </div>

                            <GuideVideo
                                src={GUIDE_MEDIA.connect}
                                label="Drag, link, and cluster Canvas notes"
                            />
                        </section>

                        <section className="Guide_Feature Guide_Feature_Three">
                            <GuideVideo
                                src={GUIDE_MEDIA.discover}
                                label="Search for new academic sources"
                            />

                            <div className="Guide_Feature_Copy">
                                <p className="Guide_Eyebrow">
                                    03&nbsp; / &nbsp;DISCOVER NEW SOURCES
                                </p>

                                <h2>
                                    Go beyond your own archive.
                                </h2>

                                <p>
                                    Use Database Search to look for
                                    academic materials related to your
                                    research question.
                                </p>

                                <ul>
                                    <li>
                                        Search by title, author,
                                        keyword, or topic.
                                    </li>
                                    <li>
                                        Use filters to narrow the
                                        results.
                                    </li>
                                    <li>
                                        Open a result to review its
                                        details.
                                    </li>
                                    <li>
                                        Follow the source link when
                                        you need the original record.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section className="Guide_Feature Guide_Feature_Four">
                            <div className="Guide_Feature_Copy">
                                <p className="Guide_Eyebrow">
                                    04&nbsp; / &nbsp;START A CONVERSATION
                                </p>

                                <h2>
                                    Ask questions with context.
                                </h2>

                                <p>
                                    Use the chat panel to explore your
                                    materials through questions and
                                    follow-up prompts.
                                </p>

                                <ul>
                                    <li>
                                        Ask without selecting notes
                                        for a general response.
                                    </li>
                                    <li>
                                        Select one or more notes for a
                                        source-grounded answer.
                                    </li>
                                    <li>
                                        Open citations and compare the
                                        answer with the original
                                        material.
                                    </li>
                                </ul>
                            </div>

                            <GuideVideo
                                src={GUIDE_MEDIA.conversation}
                                label="Ask the AI questions using selected sources"
                            />
                        </section>
                    </div>

                    <section className="Guide_End_Card">
                        <div className="Guide_Research_Tools">
                            <p className="Guide_Eyebrow Guide_Eyebrow_Light">
                                05&nbsp; / &nbsp;RESEARCH TOOLS
                            </p>

                            <h2>
                                Take your research further.
                            </h2>

                            <p className="Guide_Research_Lead">
                                Select the relevant notes first, then
                                choose a tool to summarise, compare,
                                test, or structure your ideas.
                            </p>

                            <div className="Guide_Tool_Grid">
                                {RESEARCH_TOOLS.map(
                                    (tool) => (
                                        <article
                                            className="Guide_Tool_Card"
                                            key={tool.number}
                                        >
                                            <h3>
                                                <span>
                                                    {tool.number}
                                                </span>
                                                <span aria-hidden="true">
                                                    /
                                                </span>
                                                {tool.title}
                                            </h3>

                                            <p>
                                                {tool.description}
                                            </p>
                                        </article>
                                    )
                                )}
                            </div>
                        </div>

                        <footer className="Guide_Footer">
                            <div>
                                <strong>NEXO</strong>
                                <span>Ready to begin?</span>
                            </div>

                            {/*
                              The reference Send Feedback button is
                              intentionally omitted for now.
                            */}
                            <button
                                type="button"
                                className="Guide_Button Guide_Button_Primary"
                                onClick={goToWorkspace}
                            >
                                Back to Workspace
                                <span aria-hidden="true">↗</span>
                            </button>
                        </footer>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default HowToUsePage;
