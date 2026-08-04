import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("grid");

    const [projects, setProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    const formatDashboardDate = (value) => {
        if (!value) {
            return "Recently";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Recently";
        }

        const today = new Date();
        const sameDay =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

        if (sameDay) {
            return "Today";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    };

    const loadProjects = async () => {
        setIsLoadingProjects(true);
        setDashboardError("");

        try {
            const data = await apiRequest("/canvases");

            const loadedProjects = (data.canvases || []).map((canvas) => ({
                id: canvas.id,
                title: canvas.title || "Untitled Project",
                owner: "You",
                sources: canvas.source_count ?? 0,
                lastOpened: formatDashboardDate(canvas.last_opened_at),
                access: canvas.access_level === "shared" ? "Shared" : "Private",
                pinned: Boolean(canvas.is_pinned),
                updated: formatDashboardDate(canvas.updated_at || canvas.created_at),
                theme: canvas.cover_type || "cards",
            }));

            setProjects(loadedProjects);
        } catch (error) {
            console.error("Load projects error:", error);
            setDashboardError(error.message || "Failed to load projects.");
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleCreateProject = async () => {
        try {
            const data = await apiRequest("/canvases", {
                method: "POST",
                body: JSON.stringify({
                    title: "Untitled Project",
                }),
            });

            const canvasId = data.canvas?.id;

            if (!canvasId) {
                throw new Error("Canvas was created but no id was returned.");
            }

            navigate(`/workspace/${canvasId}`);
        } catch (error) {
            console.error("Create project error:", error);
            alert(error.message || "Failed to create project.");
        }
    };

    const handleOpenProject = async (project) => {
        try {
            await apiRequest(`/canvases/${project.id}/open`, {
                method: "PATCH",
            });
        } catch (error) {
            console.warn("Could not update last opened time:", error);
        }

        navigate(`/workspace/${project.id}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("nexo_token");
        localStorage.removeItem("nexo_user");
        navigate("/login");
    };

    useEffect(() => {
        loadProjects();
    }, []);

    return (
        <div className="Dashboard_Page">
        <header className="Dashboard_Header">
            <button type="button" className="Dashboard_Logo_Block" onClick={() => navigate("/dashboard")}>
                <h1>NEXO</h1>
                <p>RESEARCH WORKSPACE</p>
            </button>

            <input
            className="Dashboard_Search"
            placeholder="Search projects, sources, or collaborators"
            />

            <div className="Dashboard_Header_Actions">
            <button type="button">?</button>
            <button type="button">⌾</button>
            <button type="button" className="Dashboard_User" onClick={handleLogout} title="Logout">
                N
            </button>
            </div>
        </header>

        <main className="Dashboard_Main">
            <section className="Dashboard_Start">
            <div className="Dashboard_Section_Title">
                <h2>Start a new project</h2>
                <span>Choose a starting point — you can change it anytime</span>
            </div>

            <div className="Dashboard_Start_Grid">
                <button
                type="button"
                className="Dashboard_Start_Card"
                onClick={handleCreateProject}
                >
                <div className="Dashboard_Start_Icon">＋</div>

                <div className="Dashboard_Start_Bottom">
                    <strong>Blank research space</strong>
                    <span>→</span>
                </div>
                </button>

                <button
                type="button"
                className="Dashboard_Start_Card"
                onClick={handleCreateProject}
                >
                <div className="Dashboard_Start_Icon">⇧</div>

                <div className="Dashboard_Start_Bottom">
                    <strong>Import existing sources</strong>
                    <span>→</span>
                </div>
                </button>
            </div>
            </section>

            <section className="Dashboard_Projects">
            <div className="Dashboard_Section_Title">
                <h2>Your projects</h2>
                <span>{projects.length} projects · Synced just now</span>
            </div>

            <div className="Dashboard_Project_Toolbar">
                <div className="Dashboard_Filter_Row">
                <button className="Active">All</button>
                <button>Owned by me</button>
                <button>Shared with me</button>
                <button>Archived</button>
                </div>

                <div className="Dashboard_View_Tools">
                <select>
                    <option>Last opened</option>
                    <option>Recently updated</option>
                    <option>Name</option>
                </select>

                <button
                    type="button"
                    className={viewMode === "grid" ? "Active" : ""}
                    onClick={() => setViewMode("grid")}
                >
                    ▦
                </button>

                <button
                    type="button"
                    className={viewMode === "list" ? "Active" : ""}
                    onClick={() => setViewMode("list")}
                >
                    ☰
                </button>
                </div>
            </div>
            {dashboardError && (
                <div className="Dashboard_Status_Message Dashboard_Error">
                    {dashboardError}
                </div>
            )}

            {isLoadingProjects && (
                <div className="Dashboard_Status_Message">
                    Loading your projects...
                </div>
            )}

            {!isLoadingProjects && projects.length === 0 && (
                <div className="Dashboard_Empty_State">
                    <h3>No projects yet</h3>
                    <p>Create a blank research space to start organizing sources, notes, and AI frameworks.</p>
                    <button type="button" onClick={handleCreateProject}>
                        Create your first project
                    </button>
                </div>
            )}
            {!isLoadingProjects && projects.length > 0 && (
                viewMode === "grid" ? (
                <div className="Dashboard_Project_Grid">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        className="Dashboard_Project_Card"
                        onClick={() => handleOpenProject(project)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                            handleOpenProject(project);
                            }
                        }}
                    >
                    <div className={`Dashboard_Project_Thumbnail Theme_${project.theme}`}>
                        <div className="Thumb_Lines"></div>
                        <div className="Thumb_Doc Thumb_Dark"></div>
                        <div className="Thumb_Doc Thumb_Light"></div>
                        <div className="Thumb_Dot"></div>
                    </div>

                    <div className="Dashboard_Project_Info">
                        <div>
                        <h3>{project.title}</h3>
                        <p>
                            {project.pinned ? "Pinned · " : ""}
                            {project.owner} · {project.sources} sources · Opened {project.lastOpened}
                        </p>

                        <div className="Dashboard_Project_Badges">
                            <span>{project.access}</span>
                            <span>{project.updated}</span>
                        </div>
                        </div>

                        <button type="button" className="Dashboard_Project_Menu" 
                            onClick={(event) => {
                                event.stopPropagation();
                                alert("Project menu coming soon.");
                            }}
                        >
                            •••
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="Dashboard_Project_List">
                <div className="Dashboard_List_Header">
                    <span>Project</span>
                    <span>Owner</span>
                    <span>Sources</span>
                    <span>Last opened</span>
                    <span>Access</span>
                    <span></span>
                </div>

                {projects.map((project) => (
                    <button
                    key={project.id}
                    type="button"
                    className="Dashboard_List_Row"
                    onClick={() => handleOpenProject(project)}
                    >
                    <div className="Dashboard_List_Project">
                        <div className="Dashboard_List_Thumb">
                        <div></div>
                        <span></span>
                        </div>

                        <div>
                        <h3>{project.title}</h3>
                        <p>
                            {project.pinned ? "Pinned · " : ""}
                            {project.updated}
                        </p>
                        </div>
                    </div>

                    <span>{project.owner}</span>
                    <span>{project.sources}</span>
                    <span>{project.lastOpened}</span>
                    <span>● {project.access}</span>
                    <span>•••</span>
                    </button>
                ))}
                </div>
            ))}
            </section>
        </main>
        </div>
    );
}

export default Dashboard;