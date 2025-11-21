"use client";

import type { VerifyLoginPayloadParams } from "thirdweb/auth";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

import { client } from "~/app/utils/thirdwebClient";

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "discord", "telegram", "email", "phone", "passkey"],
    },
  }),
];

export function ConnectWallet() {
  const wallet = useActiveWallet();

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectButton={{
        label: "Sign In",
      }}
      detailsButton={{
        displayBalanceToken: undefined,
        render: () => (
          <button
            onClick={async () => {
              await fetch("/api/auth/thirdweb/logout", { method: "POST" });
              wallet?.disconnect();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            Sign Out
          </button>
        ),
      }}
      connectModal={{
        size: "compact",
        showThirdwebBranding: false,
      }}
      auth={{
        getLoginPayload: async ({ address, chainId }) => {
          const res = await fetch("/api/auth/thirdweb/payload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, chainId }),
          });
          return res.json();
        },
        doLogin: async (params: VerifyLoginPayloadParams) => {
          await fetch("/api/auth/thirdweb/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          });
        },
        isLoggedIn: async () => {
          const res = await fetch("/api/auth/thirdweb/user");
          const data = await res.json();
          return !!data.user;
        },
        doLogout: async () => {
          await fetch("/api/auth/thirdweb/logout", { method: "POST" });
        },
      }}
      signInButton={{
        label: "Sign In",
      }}
    />
  );
}
