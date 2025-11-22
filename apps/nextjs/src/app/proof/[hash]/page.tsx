"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { signMessage } from "thirdweb/utils";

import { ProofVerificationCard } from "@acme/ui/proof-verification-card";
import { OwnershipVerificationDialog } from "@acme/ui/ownership-verification-dialog";

import {
  verifyCertificateOwnership,
  generateChallengeMessage,
} from "~/app/actions/proof";
import { env } from "~/env";

type VerificationStatus = "idle" | "verifying" | "success" | "failure";

export default function ProofPage() {
  const params = useParams();
  const hash = params.hash as string;

  // Thirdweb wallet hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  // Ownership verification state
  const [ownershipStatus, setOwnershipStatus] =
    useState<VerificationStatus>("idle");
  const [verifiedAddress, setVerifiedAddress] = useState<string>();
  const [ownershipError, setOwnershipError] = useState<string>();

  useEffect(() => {
    // Simulate API call
    const verify = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result based on hash
      if (hash === "invalid") {
        setResult({
          valid: false,
          reason: "Proof not found or invalid hash format.",
        });
      } else if (hash === "revoked") {
        setResult({
          valid: false,
          reason: "This proof has been revoked by the user.",
        });
      } else {
        setResult({
          valid: true,
          userName: "Alice User",
          courseName: "Blockchain 101",
          courseCode: "BC101",
          tokenId: 101,
          createdAt: new Date("2023-03-01"),
          expiresAt: new Date("2023-04-01"),
        });
      }
      setIsLoading(false);
    };

    verify();
  }, [hash]);

  const handleProveOwnership = async () => {
    if (!account || !wallet || !result?.tokenId) {
      setOwnershipError("Wallet not connected");
      setOwnershipStatus("failure");
      return;
    }

    setOwnershipStatus("verifying");
    setOwnershipError(undefined);

    try {
      // Get contract address from env with fallback
      const contractAddress =
        env.NEXT_PUBLIC_TRAINING_CERTIFICATION_ADDRESS ?? "";
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      // Generate challenge message
      const message = generateChallengeMessage(
        BigInt(result.tokenId),
        contractAddress,
      );

      // Request signature from user's wallet
      const signature = await signMessage({
        account,
        message,
      });

      // Verify signature and check on-chain ownership
      const verificationResult = await verifyCertificateOwnership(
        message,
        signature,
        account.address,
        BigInt(result.tokenId),
      );

      if (verificationResult.success) {
        setOwnershipStatus("success");
        setVerifiedAddress(verificationResult.address);
      } else {
        setOwnershipStatus("failure");
        setOwnershipError(verificationResult.error);
      }
    } catch (error) {
      console.error("Error proving ownership:", error);
      setOwnershipStatus("failure");

      // Handle user rejection
      if (error instanceof Error && error.message.includes("user rejected")) {
        setOwnershipError("Signature request was rejected");
      } else {
        setOwnershipError(
          error instanceof Error ? error.message : "Verification failed",
        );
      }
    }
  };

  const handleConnectWallet = () => {
    // The ConnectWallet component will handle this
    // This is just a placeholder - the actual connection UI
    // should be shown in the parent layout or via a modal
    console.log("Connect wallet clicked - show connect modal");
  };

  const handleDialogClose = () => {
    // Reset to idle state when dialog closes
    if (ownershipStatus !== "verifying") {
      setOwnershipStatus("idle");
      setVerifiedAddress(undefined);
      setOwnershipError(undefined);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Certificate Verification</h1>
        <p className="text-muted-foreground">
          Verifying proof hash:{" "}
          <span className="bg-muted rounded px-2 py-1 font-mono text-sm">
            {hash}
          </span>
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <ProofVerificationCard
          result={result || { valid: false }}
          isLoading={isLoading}
        />

        {/* Only show ownership verification for valid certificates */}
        {!isLoading && result?.valid && (
          <div className="flex justify-center">
            <OwnershipVerificationDialog
              isWalletConnected={!!account}
              status={ownershipStatus}
              verifiedAddress={verifiedAddress}
              errorMessage={ownershipError}
              onProveOwnership={handleProveOwnership}
              onConnectWallet={handleConnectWallet}
              onDialogClose={handleDialogClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
