import { Blocks } from "lucide-react";
import { Link } from "react-router-dom";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? "brand--compact" : ""}`}
      aria-label="WebHTML Class กลับหน้าหลัก"
    >
      <span className="brand__mark" aria-hidden="true">
        <Blocks size={27} strokeWidth={2.2} />
      </span>
      <span className="brand__words">
        <strong>
          WEBHTML
          <br />
          <em>CLASS</em>
        </strong>
        {!compact && <small>LEARN • TRY • BUILD • REFLECT</small>}
      </span>
    </Link>
  );
}
