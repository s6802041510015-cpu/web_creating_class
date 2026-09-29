import { ArrowRight, Code2, Gamepad2, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

type Action = {
  title: string;
  description: string;
  cta: string;
  to?: string;
  icon: LucideIcon;
  className: string;
};
const actions: Action[] = [
  {
    title: "Code Lab",
    description: "ทดลองเขียน HTML และเห็นผลทันที",
    cta: "ลองเขียนโค้ด",
    to: "/code-lab",
    icon: Code2,
    className: "action-card--blue",
  },
  {
    title: "Workshop",
    description: "ฝึกสร้างหน้าเว็บทีละขั้นตอน",
    cta: "เริ่ม Workshop",
    to: "/workshop",
    icon: Wrench,
    className: "action-card--purple",
  },
  {
    title: "WEB CITY",
    description: "เกมเสริมการเรียนรู้",
    cta: "เร็ว ๆ นี้",
    icon: Gamepad2,
    className: "action-card--cyan",
  },
];

export function QuickActions() {
  return (
    <section className="section-block" aria-labelledby="actions-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">EXPLORE & CREATE</span>
          <h2 id="actions-title">ลองทำอะไรต่อดี?</h2>
        </div>
      </div>
      <div className="action-grid">
        {actions.map((action) => (
          <article
            className={`action-card ${action.className}`}
            key={action.title}
          >
            <div className="action-card__icon">
              <action.icon size={25} strokeWidth={1.8} />
            </div>
            <div className="action-card__content">
              <div className="action-card__title">
                <h3>{action.title}</h3>
                {!action.to && <StatusBadge>เร็ว ๆ นี้</StatusBadge>}
              </div>
              <p>{action.description}</p>
            </div>
            <Button
              to={action.to}
              disabled={!action.to}
              variant="ghost"
              className="action-card__button"
            >
              {action.cta}
              {action.to && <ArrowRight size={16} />}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
