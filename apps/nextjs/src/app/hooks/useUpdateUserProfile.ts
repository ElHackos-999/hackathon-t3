"use client";

import { useEffect, useRef } from "react";
import { useActiveWallet } from "thirdweb/react";
import { getProfiles } from "thirdweb/wallets";

import { updateUserProfile } from "~/app/actions/auth";
import { client } from "~/app/utils/thirdwebClient";

/**
 * Hook that automatically updates the user's profile with data from their connected wallet.
 * Should be used in a component that renders after the user is logged in.
 */
export function useUpdateUserProfile() {
  const wallet = useActiveWallet();
  const hasUpdated = useRef(false);

  useEffect(() => {
    if (!wallet || hasUpdated.current) return;

    const updateProfile = async () => {
      try {
        const profiles = await getProfiles({ client });

        console.log("Fetched profiles:", profiles);

        if (profiles && profiles.length > 0) {
          const details = profiles[0]?.details;
          const email = details?.email;
          const name = email?.split("@")[0];

          if (email || name) {
            await updateUserProfile({ name, email });
            hasUpdated.current = true;
          }
        }
      } catch (error) {
        console.error("Error updating user profile:", error);
      }
    };

    void updateProfile();
  }, [wallet]);
}
