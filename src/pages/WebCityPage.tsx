import { Gamepad2, Map, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";

export function WebCityPage() {
  return (
    <div className="inner-page">
      <section className="web-city">
        <div className="web-city__art" aria-hidden="true">
          <Map size={154} strokeWidth={0.7} />
          <span>
            <Gamepad2 size={38} />
          </span>
        </div>
        <span className="eyebrow">
          <Sparkles size={15} /> COMING SOON
        </span>
        <h1>
          WEB CITY
          <br />
          <span>CODE QUEST</span>
        </h1>
        <p className="web-city__english">Explore the City. Master the Web.</p>
        <p>เกมเสริมการเรียนรู้กำลังพัฒนา</p>
        <Button disabled>เร็ว ๆ นี้</Button>
      </section>
    </div>
  );
}
