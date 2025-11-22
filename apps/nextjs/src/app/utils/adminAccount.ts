import { privateKeyToAccount } from "thirdweb/wallets";

import { env } from "~/env";
import { client } from "./thirdwebClient";

/**
 * Get the admin wallet account for signing transactions
 * IMPORTANT: This should only be used in server-side code
 * @returns Admin wallet account instance
 * @throws Error if PRIVATE_KEY is not set
 */
export function getAdminAccount() {
  if (!env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set in environment variables");
  }

  return privateKeyToAccount({
    client,
    privateKey: env.PRIVATE_KEY,
  });
}
