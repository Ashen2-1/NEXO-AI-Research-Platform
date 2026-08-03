import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");

  const projects = [
    {
      id: "default",
      title: "Photography and Evidence",
      owner: "You",
      sources: 12,
      lastOpened: "Today, 9:42 PM",
      access: "Private",
      pinned: true,
      updated: "Updated today",
    },
    {
      id: "modern-design",
      title: "Emptiness in Modern Design",
      owner: "You + 2",
      sources: 8,
      lastOpened: "Yesterday",
      access: "Shared",
      updated: "Updated yesterday",
    },
    {
      id: "archive-politics",
      title: "Visual Politics of the Archive",
      owner: "You",
      sources: 17,
      lastOpened: "Jul 22",
      access: "Private",
      updated: "Updated Jul 22",
    },
    {
      id: "ways-of-seeing",
      title: "Ways of Seeing — Seminar Notes",
      owner: "Maya Chen",
      sources: 5,
      lastOpened: "Jul 18",
      access: "Shared",
      updated: "Updated Jul 18",
    },
    {
      id: "renaissance-networks",
      title: "Renaissance Workshop Networks",
      owner: "You",
      sources: 21,
      lastOpened: "Jul 12",
      access: "Private",
      updated: "Updated Jul 12",
    },
    {
      id: "museum-interface",
      title: "Museum Interface Study",
      owner: "You",
      sources: 9,
      lastOpened: "Jun 30",
      access: "Private",
      updated: "Updated Jun 30",
    },
  ];

  const handleCreateProject = () => {
    navigate("/workspace/default");
  };

  const handleOpenProject = (project) => {
    navigate(`/workspace/${project.id}`);
  };

  return (
    <div className="Dashboard_Page">
      <header className="Dashboard_Header">
        <div className="Dashboard_Logo_Block">
          <h1>NEXO</h1>
          <p>RESEARCH WORKSPACE</p>
        </div>

        <input
          className="Dashboard_Search"
          placeholder="Search projects, sources, or collaborators"
        />

        <div className="Dashboard_Header_Actions">
          <button type="button">?</button>
          <button type="button">⌾</button>
          <div className="Dashboard_User">A</div>
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

          {viewMode === "grid" ? (
            <div className="Dashboard_Project_Grid">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="Dashboard_Project_Card"
                  onClick={() => handleOpenProject(project)}
                >
                  <div className="Dashboard_Project_Thumbnail">
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
                        {project.owner} · Opened {project.lastOpened} ·{" "}
                        {project.sources} sources
                      </p>
                    </div>

                    <span>•••</span>
                  </div>
                </button>
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
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;