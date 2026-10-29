import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../state/Theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    return (
      <button
        className="theme-toggle__compact"
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`เปลี่ยนเป็นธีม${nextTheme === "light" ? "สว่าง" : "มืด"}`}
        title={`เปลี่ยนเป็นธีม${nextTheme === "light" ? "สว่าง" : "มืด"}`}
      >
        {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      </button>
    );
  }

  return (
    <div className="theme-toggle" role="group" aria-label="ธีมการแสดงผล">
      <span className="theme-toggle__label">ธีมการแสดงผล</span>
      <div className="theme-toggle__choices">
        <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
          <Sun size={16} aria-hidden="true" /> สว่าง
        </button>
        <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
          <Moon size={16} aria-hidden="true" /> มืด
        </button>
      </div>
    </div>
  );
}
