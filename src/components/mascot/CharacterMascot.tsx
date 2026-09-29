type Variant = "hero" | "guide" | "small";

export function CharacterMascot({ variant = "hero" }: { variant?: Variant }) {
  return (
    <img
      className={`character character--${variant}`}
      src={`${import.meta.env.BASE_URL}assets/webquest-student.png`}
      alt="ตัวละครผู้ช่วยการเรียนรู้ WebQuest Studio"
    />
  );
}
