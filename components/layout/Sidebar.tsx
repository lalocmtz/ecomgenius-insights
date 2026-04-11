"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Play,
  Users,
  Package,
  Calculator,
  Upload,
  Sparkles,
  Settings,
} from "lucide-react";
import { BrandSwitcher } from "./BrandSwitcher";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "", icon: Home },
  { label: "Campanas", href: "/campaigns", icon: BarChart3 },
  { label: "Creativos", href: "/creatives", icon: Play },
  { label: "Afiliados", href: "/affiliates", icon: Users },
  { label: "Productos", href: "/products", icon: Package },
  { label: "Calculadora", href: "/calculator", icon: Calculator },
  { label: "Subir archivos", href: "/upload", icon: Upload },
  { label: "Reporte AI", href: "/report", icon: Sparkles },
  { label: "Configuracion", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const brandSlug = pathname.split("/")[2] || "";
  const brandBase = `/brands/${brandSlug}`;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#30363d] bg-[#0d1117]">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-lg font-bold text-[#e6edf3]">
          Ecom<span className="text-[#f97316]">Genius</span>
        </span>
        <span className="text-xs text-[#8b949e]">Intelligence</span>
      </div>

      <div className="px-3 pb-4">
        <BrandSwitcher currentSlug={brandSlug} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const fullHref = item.href
            ? `${brandBase}${item.href}`
            : brandBase;

          const isActive =
            item.href === ""
              ? pathname === brandBase || pathname === `${brandBase}/`
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.label}
              href={fullHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-l-2 border-[#f97316] bg-[#f97316]/10 text-[#f97316]"
                  : "border-l-2 border-transparent text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#30363d] px-3 py-3" />
    </aside>
  );
}
