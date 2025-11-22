"use server";

import { verifyEOASignature } from "thirdweb/auth";
import { balanceOf } from "thirdweb/extensions/erc1155";

import { getTrainingCertificationContract } from "../utils/contract";

/**
 * Result type for ownership verification
 */
export type OwnershipVerificationResult =
  | { success: true; address: string }
  | { success: false; error: string };

/**
 * Verify certificate ownership by checking signature and on-chain balance
 *
 * @param message - The challenge message that was signed
 * @param signature - The signature from the user's wallet
 * @param address - The wallet address claiming ownership
 * @param tokenId - The certificate token ID to verify ownership of
 * @returns Result indicating success with verified address or failure with error message
 */
export async function verifyCertificateOwnership(
  message: string,
  signature: string,
  address: string,
  tokenId: bigint,
): Promise<OwnershipVerificationResult> {
  try {
    // Step 1: Verify the signature is valid for the given address
    const isValid = await verifyEOASignature({
      message,
      signature,
      address,
    });

    if (!isValid) {
      return {
        success: false,
        error: "Invalid signature",
      };
    }

    // Step 2: Check on-chain balance for the recovered address
    const contract = getTrainingCertificationContract();

    const balance = await balanceOf({
      contract,
      owner: address,
      tokenId,
    });

    // Step 3: Verify the user owns at least one of the certificate
    if (balance > 0n) {
      return {
        success: true,
        address,
      };
    }

    return {
      success: false,
      error: "You don't own this certificate",
    };
  } catch (error) {
    console.error("Error verifying certificate ownership:", error);

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("invalid signature")) {
        return {
          success: false,
          error: "Invalid signature format",
        };
      }

      if (errorMessage.includes("network") || errorMessage.includes("rpc")) {
        return {
          success: false,
          error: "Network error. Please try again.",
        };
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to verify ownership",
    };
  }
}

/**
 * Generate a challenge message for ownership verification
 *
 * @param tokenId - The certificate token ID
 * @param contractAddress - The contract address
 * @returns The challenge message to be signed
 */
export async function generateChallengeMessage(
  tokenId: bigint,
  contractAddress: string,
): Promise<string> {
  const timestamp = Date.now();
  return `Prove ownership of certificate #${tokenId} at contract ${contractAddress}

Timestamp: ${timestamp}

This signature will only be used to verify your ownership of this certificate.`;
}
