import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../navigation/AppSidebar";
import { MobileNavigation } from "../navigation/MobileNavigation";

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        ข้ามไปยังเนื้อหา
      </a>
      <AppSidebar />
      <MobileNavigation
        open={menuOpen}
        onToggle={() => setMenuOpen((value) => !value)}
        onClose={closeMenu}
      />
      <main className="main-content" id="main-content" tabIndex={-1}>
        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
