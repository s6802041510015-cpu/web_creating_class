import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type TutorPageDetails = {
  path: string;
  kind: "lesson" | "code-lab" | "workshop";
  title: string;
  detail: string;
  code?: string;
};

type TutorPageState = {
  page: TutorPageDetails | null;
  setPage: (page: TutorPageDetails | null) => void;
};

const TutorPageContext = createContext<TutorPageState | null>(null);

export function TutorPageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<TutorPageDetails | null>(null);
  return (
    <TutorPageContext.Provider value={{ page, setPage }}>
      {children}
    </TutorPageContext.Provider>
  );
}

export function useTutorPage() {
  const context = useContext(TutorPageContext);
  if (!context) throw new Error("useTutorPage must be used inside TutorPageProvider");
  return context;
}
