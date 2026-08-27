import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import Navbar from "../pages/navbar/Navbar";
import Sidebar from "./sidebar/Sidebar";
import Dashboard from "./sidebar/dashboard/Dashboard";
// import Categories from './sidebar/Categories/Categories';
import SoundManagement from "./sidebar/SoundManagement/SoundManagement";
// import SubscriptionManagement from './sidebar/SubscriptionManagement/SubscriptionManagement';
import UserManagement from "./sidebar/UserManagement/UserManagement";
import Settings from "./sidebar/Settings/Settings";
import CategoryManagement from "./sidebar/CategoryManagment/CategoryManagement";
import ActivationCodeManagement from "./sidebar/ActivationCodeManagement/ActivationCodeManagement";
import EntitlementManagement from "./sidebar/EntitlementManagement/EntitlementManagement";
import DiscountManagement from "./sidebar/DiscountManagement/DiscountManagement";
import PriceManagement from "./sidebar/PriceManagement/PriceManagement";
import TeamManagement from "./sidebar/TeamManagement/TeamManagement";
import {
  isMenuItemAllowed,
  loadSection,
  saveSection,
} from "./sidebar/menuConfig";
function Home() {
  const { accessToken, role } = useContext(AuthContext);
  const [selectedContent, setSelectedContent] = useState(() =>
    loadSection(role)
  );

  const handleMenuItemClick = (content) => {
    setSelectedContent(content);
    saveSection(content);
  };

  const renderContent = () => {
    // Belt and braces: the sidebar already hides disallowed sections, but the
    // API would reject these calls anyway, so show a clear message instead.
    if (!isMenuItemAllowed(selectedContent, role)) {
      return (
        <div className="page">
          <div className="card">
            <div className="card-body empty-state">
              <p className="card-title">Access denied</p>
              <p className="mt-2">
                Your role does not have permission to view this section.
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch (selectedContent) {
      case "Dashboard":
        return <Dashboard />;
      case "Categories":
        return <CategoryManagement />;
      case "SoundManagement":
        return <SoundManagement />;
      // case 'Subscription':
      //   return <SubscriptionManagement />;
      case "UserManagement":
        return <UserManagement />;
      case "Settings":
        return <Settings />;
      case "ActivationCodes":
        return <ActivationCodeManagement accessToken={accessToken} />;
      case "EntitlementManagement":
        return <EntitlementManagement accessToken={accessToken} />;
      case "DiscountManagement":
        return <DiscountManagement />;
      case "PriceManagement":
        return <PriceManagement />;
      case "TeamManagement":
        return <TeamManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar onMenuItemClick={handleMenuItemClick} />
        <main className="app-main">{renderContent()}</main>
      </div>
    </div>
  );
}

export default Home;
