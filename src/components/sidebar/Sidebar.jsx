import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { CgList } from "react-icons/cg";
import { FaUser, FaUsers, FaBars, FaTimes, FaTicketAlt } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";
import { LuLayoutDashboard } from "react-icons/lu";
import { TbMusicCog } from "react-icons/tb";
import { AuthContext } from "../../context/authContext";
import { getNavGroups, loadSection } from "./menuConfig";

const SECTION_ICONS = {
  Dashboard: LuLayoutDashboard,
  Categories: CgList,
  SoundManagement: TbMusicCog,
  UserManagement: FaUser,
  EntitlementManagement: FaTicketAlt,
  TeamManagement: FaUsers,
  Settings: IoSettings,
};

const COLLAPSE_KEY = "comeaway:sidebar-collapsed";

function Sidebar({ onMenuItemClick }) {
  const { role } = useContext(AuthContext);
  // Remember the rail preference between sessions.
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true"
  );
  // Keep the highlight in step with the section Home opens.
  const [activeTab, setActiveTab] = useState(() => loadSection(role));

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const handleMenuItemClick = (tab) => {
    setActiveTab(tab);
    onMenuItemClick(tab);
  };

  const navGroups = getNavGroups(role);

  return (
    <aside className={`app-sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setIsCollapsed((prev) => !prev)}
        title={isCollapsed ? "Expand menu" : "Collapse menu"}
        aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
      >
        {isCollapsed ? <FaBars size={15} /> : <FaTimes size={15} />}
      </button>

      <nav className="sidebar-nav">
        {navGroups.map((group, groupIndex) => (
          <div key={group.group}>
            {isCollapsed ? (
              // A rule reads cleaner than a truncated heading on the rail.
              groupIndex > 0 && <div className="sidebar-group-divider" />
            ) : (
              <p className="sidebar-group-label">{group.group}</p>
            )}
            {group.items.map((item) => {
              const Icon = SECTION_ICONS[item.name] || CgList;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleMenuItemClick(item.name)}
                  className={`nav-item ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-item-icon">
                    <Icon size={17} />
                  </span>
                  {!isCollapsed && (
                    <span className="nav-item-label">{item.label}</span>
                  )}
                  {isCollapsed && (
                    <span className="nav-tooltip">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  onMenuItemClick: PropTypes.func.isRequired,
};

export default Sidebar;
