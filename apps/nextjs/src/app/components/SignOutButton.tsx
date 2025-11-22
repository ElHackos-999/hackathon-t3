"use client";

import { useActiveWallet } from "thirdweb/react";

import { Button } from "@acme/ui/button";

import { logout } from "~/app/actions/auth";

export function SignOutButton() {
  const wallet = useActiveWallet();

  const handleSignOut = async () => {
    await logout();
    wallet?.disconnect();
  };

  return (
    <Button
      variant="ghost"
      className="w-full cursor-pointer justify-start"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}
