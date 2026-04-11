"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "": "Overview",
  campanas: "Campanas",
  creativos: "Creativos",
  afiliados: "Afiliados",
  productos: "Productos",
  calculadora: "Calculadora",
  subir: "Subir archivos",
  "reporte-ai": "Reporte AI",
  settings: "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "";
  const title = pageTitles[lastSegment] || lastSegment;

  return (
    <header className="flex h-14 items-center border-b border-[#30363d] px-6">
      <h1 className="text-lg font-semibold text-[#e6edf3]">{title}</h1>
    </header>
  );
}
