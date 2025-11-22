"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@acme/ui";

import { Button } from "./button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  footer?: React.ReactNode;
}

const mainLinks = [
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
];

const verificationLinks = [
  {
    name: "Verify Proof",
    href: "/proof/verify",
    icon: ShieldCheck,
  },
];

function SidebarContent({
  pathname,
  footer,
  onLinkClick,
}: {
  pathname: string | null;
  footer?: React.ReactNode;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between space-y-4 py-4">
      <div className="space-y-4 px-3 py-2">
        <div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Proof of Certificate
          </h2>
          <div className="space-y-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={onLinkClick}
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

        <div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Verification
          </h2>
          <div className="space-y-1">
            {verificationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={
                    pathname?.startsWith("/proof") ? "secondary" : "ghost"
                  }
                  className="w-full justify-start"
                  asChild
                  onClick={onLinkClick}
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
      </div>

      {footer && (
        <div className="px-3 py-2">
          <div className="space-y-1">{footer}</div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className, footer }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile burger menu */}
      <div className="bg-background fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b px-4 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent
              pathname={pathname}
              footer={footer}
              onLinkClick={() => setIsOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span className="ml-2 font-semibold">Proof of Certificate</span>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "bg-background hidden min-h-screen w-64 border-r pb-12 md:block",
          className,
        )}
      >
        <SidebarContent pathname={pathname} footer={footer} />
      </div>
    </>
  );
}
