import { Blocks } from "lucide-react";
import { Link } from "react-router-dom";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? "brand--compact" : ""}`}
      aria-label="WebQuest Studio กลับหน้าหลัก"
    >
      <span className="brand__mark" aria-hidden="true">
        <Blocks size={27} strokeWidth={2.2} />
      </span>
      <span className="brand__words">
        <strong>
          WEBQUEST
          <br />
          <em>STUDIO</em>
        </strong>
        {!compact && <small>LEARN • TRY • BUILD • REFLECT</small>}
      </span>
    </Link>
  );
}
