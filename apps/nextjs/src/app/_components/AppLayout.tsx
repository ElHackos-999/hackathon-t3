import { Sidebar } from "@acme/ui/sidebar";

import { isLoggedIn } from "~/app/actions/auth";
import { LandingPage } from "./LandingPage";
import { ProfileUpdater } from "./ProfileUpdater";
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
      <ProfileUpdater />
      <Sidebar footer={<SignOutButton />} />
      <main className="flex-1 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
