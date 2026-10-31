import { useState } from "react";
import { NavLink } from "react-router-dom";
import { UserRound } from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { navigation } from "../../data/navigation";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useLineAuth } from "../../state/LineAuth";

export function AppSidebar() {
  const { user, isDemo } = useLineAuth();
  const [failedPictureUrl, setFailedPictureUrl] = useState<string | null>(null);
  const pictureUrl = user?.pictureUrl && user.pictureUrl !== failedPictureUrl ? user.pictureUrl : null;
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
        <ThemeToggle />
        <div className="profile">
          <span className="profile__avatar">
            {pictureUrl
              ? <img src={pictureUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailedPictureUrl(pictureUrl)} />
              : <UserRound size={19} aria-hidden="true" />}
          </span>
          <span>
            <strong>{user?.fullName ?? user?.displayName ?? "ผู้เรียน WebHTML Class"}</strong>
            <small>{isDemo ? "โหมดทดลอง · ยังไม่เชื่อม LINE" : "เข้าสู่ระบบด้วย LINE"}</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
