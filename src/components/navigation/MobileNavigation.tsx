import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { navigation } from "../../data/navigation";

export function MobileNavigation({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const location = useLocation();
  useEffect(() => {
    onClose();
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <header className="mobile-header">
        <BrandLogo compact />
        <button
          className="icon-button"
          type="button"
          onClick={onToggle}
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={open}
          aria-controls="mobile-drawer"
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <button
          className="drawer-backdrop"
          type="button"
          onClick={onClose}
          aria-label="ปิดเมนู"
        />
      )}
      <nav
        id="mobile-drawer"
        className={`mobile-drawer ${open ? "mobile-drawer--open" : ""}`}
        aria-label="เมนูสำหรับมือถือ"
        aria-hidden={!open}
      >
        {navigation.map((item) => (
          <NavLink
            tabIndex={open ? 0 : -1}
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link--active" : ""}`
            }
          >
            <item.icon size={19} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
