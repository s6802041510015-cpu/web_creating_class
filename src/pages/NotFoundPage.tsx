import { ArrowRight, Compass } from "lucide-react";
import { Button } from "../components/ui/Button";
import { CharacterMascot } from "../components/mascot/CharacterMascot";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found__visual">
        <Compass size={38} />
        <CharacterMascot variant="small" />
      </div>
      <span className="section-kicker">404 • PAGE NOT FOUND</span>
      <h1>ดูเหมือนว่าหน้านี้จะหลงทางไปแล้ว</h1>
      <p>กลับไปเริ่มต้นเส้นทางการเรียนรู้กันอีกครั้ง</p>
      <Button to="/">
        กลับหน้าหลัก <ArrowRight size={17} />
      </Button>
    </div>
  );
}
