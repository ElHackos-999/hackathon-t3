import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";

import { client } from "~/app/utils/thirdwebClient";
import { env } from "~/env";

function getThirdwebAuth() {
  const secretKey = env.PRIVATE_KEY;
  const appUrl = env.VERCEL_URL;

  if (!secretKey || !appUrl) {
    throw new Error(
      `Missing required environment variables: PRIVATE_KEY=${!!secretKey}, NEXT_PUBLIC_APP_URL=${!!appUrl}`,
    );
  }

  return createAuth({
    domain: appUrl,
    client,
    adminAccount: privateKeyToAccount({
      client,
      privateKey: secretKey,
    }),
  });
}

export { getThirdwebAuth };
