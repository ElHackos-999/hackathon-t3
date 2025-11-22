"use client";

import { useUpdateUserProfile } from "~/app/hooks/useUpdateUserProfile";

/**
 * Client component that updates user profile from wallet data.
 * Renders nothing but triggers the profile update on mount.
 */
export function ProfileUpdater() {
  useUpdateUserProfile();
  return null;
}
