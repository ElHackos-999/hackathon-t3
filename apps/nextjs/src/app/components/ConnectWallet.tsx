"use client";

import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

import {
  generateLoginPayload,
  isLoggedIn,
  login,
  logout,
} from "~/app/actions/auth";
import { client } from "~/app/utils/thirdwebClient";

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email"],
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
              await logout();
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
          return generateLoginPayload(address, chainId);
        },
        doLogin: async (params) => {
          await login(params);
        },
        isLoggedIn: async () => {
          return isLoggedIn();
        },
        doLogout: async () => {
          await logout();
        },
      }}
      signInButton={{
        label: "Sign In",
      }}
    />
  );
}
