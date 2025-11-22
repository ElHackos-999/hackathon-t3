import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

import { env } from "~/env";
import { ERC_1155_ABI } from "./constants/abi";
import { client } from "./thirdwebClient";

/**
 * Get the TrainingCertification contract instance
 * @returns Contract instance configured for Base Sepolia
 */
export function getTrainingCertificationContract() {
  if (!env.TRAINING_CERTIFICATION_ADDRESS) {
    throw new Error(
      "TRAINING_CERTIFICATION_ADDRESS is not set in environment variables",
    );
  }

  return getContract({
    client,
    chain: baseSepolia,
    address: env.TRAINING_CERTIFICATION_ADDRESS,
    abi: ERC_1155_ABI,
  });
}
