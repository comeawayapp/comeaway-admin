import { useContext } from "react";
import { MdLogout } from "react-icons/md";
import companyname from "../../assets/companyname.png";
import { AuthContext, ROLE_LABELS } from "../../context/authContext";

const getInitials = (user) => {
  const first = user?.firstname?.[0] || "";
  const last = user?.lastname?.[0] || "";
  return (first + last).toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
};

function Navbar() {
  const { user, role, logout } = useContext(AuthContext);

  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ");

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <img src={companyname} alt="ComeAway" className="h-7" />
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="user-chip">
            <span className="user-avatar">{getInitials(user)}</span>
            <span className="hidden md:block">
              <span className="user-chip-name block">
                {fullName || user.email}
              </span>
              <span className="user-chip-role block">
                {ROLE_LABELS[role] || "Team Member"}
              </span>
            </span>
          </div>
        )}
        <button
          type="button"
          className="header-action"
          onClick={logout}
          title="Log out"
        >
          <MdLogout size={17} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
