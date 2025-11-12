import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";

const TopMenu = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigateToViewer = () => {
    navigate("/viewer");
  };

  const navigateToNewDay = () => {
    navigate("/provision");
  };

  const navigateToConsole = () => {
    window.open("/guacamole/#/settings/sessions");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("GUAC_AUTH");

    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <span style={{ cursor: "pointer" }} onClick={navigateToViewer}>
        <Logo size={50} fill="#FFF" />
      </span>
      <div style={styles.logo}>
        <span style={styles.logoText} onClick={navigateToViewer}>
          Desstops At Your Service
        </span>
      </div>

      <div style={styles.userSection}>
        <div
          style={styles.dropdownToggle}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          role="button"
          aria-expanded={isDropdownOpen}
        >
          ▼
        </div>

        {isDropdownOpen && (
          <div style={styles.dropdownMenu}>
            <button onClick={navigateToViewer} style={styles.logoutButton}>
              🏠 Home
            </button>
            <button onClick={navigateToNewDay} style={styles.logoutButton}>
              🌻 New DAY
            </button>
            <button onClick={navigateToConsole} style={styles.logoutButton}>
              ⚙️ DAYS Console
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              👤 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    height: "60px",
    marginBottom: "1px",
    backgroundColor: "#343a40",
    color: "white",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  userSection: {
    position: "relative",
  },
  dropdownToggle: {
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: "#495057",
    borderRadius: "4px",
  },
  dropdownMenu: {
    position: "absolute",
    top: "45px",
    right: "0",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "4px",
    zIndex: 1000,
    width: "188px",
    overflow: "hidden",
  },
  logoutButton: {
    width: "100%",
    padding: "10px 15px",
    textAlign: "left",
    border: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
};

export default TopMenu;

