import { Sidebar } from "@acme/ui/sidebar";

import { isLoggedIn } from "~/app/actions/auth";
import { LandingPage } from "./LandingPage";
import { SignOutButton } from "./SignOutButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

export async function AppLayout({ children }: AppLayoutProps) {
  const loggedIn = await isLoggedIn();

  if (!loggedIn) {
    return <LandingPage />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:block" footer={<SignOutButton />} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
