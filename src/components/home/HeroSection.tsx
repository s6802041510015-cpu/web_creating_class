import { ArrowRight, Sparkles } from "lucide-react";
import { Html3DScene } from "./Html3DScene";
import { Button } from "../ui/Button";

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__copy">
        <span className="hero__label">
          <Sparkles size={15} /> LEARN • TRY • BUILD
        </span>
        <h1 id="hero-title">
          21901-2002
          <br />
          <span>วิชา การสร้างเว็บไซต์</span>
        </h1>
        <p>เรียนรู้แนวคิด ทดลองเขียนโค้ด และสร้างหน้าเว็บด้วยตัวเองทีละขั้น</p>
        <Button to="/lessons/00">
          เริ่มเรียน <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </div>
      <div className="hero__visual hero__visual--3d">
        <div className="hero__glow" aria-hidden="true" />
        <Html3DScene />
      </div>
    </section>
  );
}
