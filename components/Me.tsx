"use client";

import { createContext, useContext } from "react";

const MeContext = createContext<{ name: string; email: string }>({ name: "", email: "" });

export function MeProvider({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  return <MeContext.Provider value={{ name, email }}>{children}</MeContext.Provider>;
}

export const useMe = () => useContext(MeContext);
