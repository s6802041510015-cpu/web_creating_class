import {
  BookOpen,
  ClipboardCheck,
  Code2,
  Home,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon };
export const navigation: NavItem[] = [
  { label: "หน้าหลัก", to: "/", icon: Home },
  { label: "แบบทดสอบก่อนเรียน", to: "/assessment/pre", icon: ClipboardCheck },
  { label: "บทเรียน", to: "/lessons", icon: BookOpen },
  { label: "Code Lab", to: "/code-lab", icon: Code2 },
  { label: "Workshop", to: "/workshop", icon: Wrench },
  { label: "แบบทดสอบหลังเรียน", to: "/assessment/post", icon: ClipboardCheck },
  { label: "ความก้าวหน้าของฉัน", to: "/progress", icon: TrendingUp },
];
