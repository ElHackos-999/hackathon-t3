"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@acme/ui";

import { Button } from "./button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  footer?: React.ReactNode;
}

export function Sidebar({ className, footer }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Courses",
      href: "/courses",
      icon: GraduationCap,
    },
    {
      name: "Admin",
      href: "/admin",
      icon: Settings,
    },
    {
      name: "Test Auth Page",
      href: "/test",
      icon: Settings,
    },
  ];

  return (
    <div
      className={cn(
        "bg-background min-h-screen w-64 border-r pb-12",
        className,
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <Link href="/">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Platform
            </h2>
          </Link>
          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={link.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {link.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Verification
          </h2>
          <div className="space-y-1">
            <Button
              variant={pathname?.startsWith("/proof") ? "secondary" : "ghost"}
              className="w-full cursor-pointer justify-start"
              asChild
            >
              <Link href="/proof/verify">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify Proof
              </Link>
            </Button>
          </div>
        </div>
        {footer && (
          <div className="px-3 py-2">
            <div className="space-y-1">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
