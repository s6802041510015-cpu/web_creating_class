import { NavLink } from "react-router-dom";
import { UserRound } from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { navigation } from "../../data/navigation";

export function AppSidebar() {
  return (
    <aside className="sidebar" aria-label="เมนูหลัก">
      <div className="sidebar__top">
        <BrandLogo />
      </div>
      <nav className="sidebar__nav" aria-label="เมนูหลัก">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link--active" : ""}`
            }
          >
            <item.icon size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__bottom">
        <div className="profile">
          <span className="profile__avatar">
            <UserRound size={19} aria-hidden="true" />
          </span>
          <span>
            <strong>ผู้เรียน WebQuest</strong>
            <small>พร้อมเริ่มการเรียนรู้</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
