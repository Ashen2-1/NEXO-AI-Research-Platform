import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const projects = [
    {
      id: "default",
      title: "Photography and Evidence",
      owner: "You",
      sources: 12,
      lastOpened: "Today, 9:42 PM",
      access: "Private",
      pinned: true,
    },
    {
      id: "modern-design",
      title: "Emptiness in Modern Design",
      owner: "You + 2",
      sources: 8,
      lastOpened: "Yesterday",
      access: "Shared",
    },
    {
      id: "archive-politics",
      title: "Visual Politics of the Archive",
      owner: "You",
      sources: 17,
      lastOpened: "Jul 22",
      access: "Private",
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
        <div>
          <h1>NEXO</h1>
          <p>RESEARCH WORKSPACE</p>
        </div>

        <input
          className="Dashboard_Search"
          placeholder="Search projects, sources, or collaborators"
        />

        <div className="Dashboard_User">A</div>
      </header>

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
            <div>
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
            <div>
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

        <div className="Dashboard_Filter_Row">
          <button className="Active">All</button>
          <button>Owned by me</button>
          <button>Shared with me</button>
          <button>Archived</button>
        </div>

        <div className="Dashboard_Project_Grid">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="Dashboard_Project_Card"
              onClick={() => handleOpenProject(project)}
            >
              <div className="Dashboard_Project_Thumbnail">
                <div className="Thumb_Doc Thumb_Dark"></div>
                <div className="Thumb_Doc Thumb_Light"></div>
                <div className="Thumb_Dot"></div>
              </div>

              <div className="Dashboard_Project_Info">
                <div>
                  <h3>{project.title}</h3>
                  <p>
                    {project.pinned ? "Pinned · " : ""}
                    {project.owner} · Opened {project.lastOpened} · {project.sources} sources
                  </p>
                </div>

                <span>•••</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;