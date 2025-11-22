"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Shield, Wallet, XCircle } from "lucide-react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

type VerificationStatus = "idle" | "verifying" | "success" | "failure";

interface OwnershipVerificationDialogProps {
  /** Whether user's wallet is connected */
  isWalletConnected: boolean;
  /** Current verification status */
  status: VerificationStatus;
  /** Verified wallet address (shown on success) */
  verifiedAddress?: string;
  /** Error message (shown on failure) */
  errorMessage?: string;
  /** Callback when user clicks "Prove Ownership" */
  onProveOwnership: () => void;
  /** Callback when user clicks "Connect Wallet" */
  onConnectWallet: () => void;
  /** Callback when dialog closes */
  onDialogClose?: () => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
}

/**
 * Formats a wallet address to show first 6 and last 4 characters
 * @example "0x1234567890123456789012345678901234567890" → "0x1234...7890"
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function OwnershipVerificationDialog({
  isWalletConnected,
  status,
  verifiedAddress,
  errorMessage = "You don't own this certificate",
  onProveOwnership,
  onConnectWallet,
  onDialogClose,
  disabled = false,
}: OwnershipVerificationDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Auto-open dialog when verification starts
  React.useEffect(() => {
    if (status === "verifying" || status === "success" || status === "failure") {
      setIsDialogOpen(true);
    }
  }, [status]);

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      onDialogClose?.();
    }
  };

  // Determine button props based on state
  const buttonProps = React.useMemo(() => {
    if (!isWalletConnected) {
      return {
        variant: "outline" as const,
        onClick: onConnectWallet,
        children: (
          <>
            <Wallet />
            Connect Wallet to Verify
          </>
        ),
        disabled: false,
        "aria-label": "Connect your wallet to prove certificate ownership",
      };
    }

    if (status === "verifying") {
      return {
        variant: "default" as const,
        onClick: () => {},
        children: (
          <>
            <Loader2 className="animate-spin" />
            Verifying Ownership...
          </>
        ),
        disabled: true,
        "aria-label": "Verifying certificate ownership",
        "aria-busy": "true" as const,
      };
    }

    return {
      variant: "default" as const,
      onClick: onProveOwnership,
      children: (
        <>
          <Shield />
          Prove Ownership
        </>
      ),
      disabled,
      "aria-label": "Prove you own this certificate",
    };
  }, [isWalletConnected, status, onConnectWallet, onProveOwnership, disabled]);

  return (
    <>
      {/* Trigger Button */}
      <Button className="w-full sm:w-auto" size="lg" {...buttonProps} />

      {/* Verification Result Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby={
            status === "success"
              ? "ownership-verified-description"
              : "ownership-failed-description"
          }
        >
          {/* Success State */}
          {status === "success" && verifiedAddress && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="size-10 text-green-600 dark:text-green-500" />
                </div>
                <DialogTitle className="text-2xl">
                  Ownership Verified!
                </DialogTitle>
                <DialogDescription id="ownership-verified-description">
                  You are the verified owner of this certificate.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
                  <p className="text-muted-foreground mb-2 text-center text-xs">
                    Verified Address
                  </p>
                  <p className="text-center font-mono text-sm font-semibold">
                    {truncateAddress(verifiedAddress)}
                  </p>
                </div>

                <p className="text-muted-foreground text-center text-sm">
                  Your wallet signature confirms you hold this certificate NFT.
                </p>
              </div>

              <DialogFooter className="sm:justify-center">
                <Button
                  variant="default"
                  onClick={() => handleDialogClose(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Failure State */}
          {status === "failure" && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="size-10 text-red-600 dark:text-red-500" />
                </div>
                <DialogTitle className="text-2xl">
                  Verification Failed
                </DialogTitle>
                <DialogDescription id="ownership-failed-description">
                  Unable to verify certificate ownership.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                  <p className="text-center text-sm font-medium text-red-900 dark:text-red-100">
                    {errorMessage}
                  </p>
                </div>

                <p className="text-muted-foreground text-center text-sm">
                  Make sure you're connected with the wallet that owns this
                  certificate.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    handleDialogClose(false);
                    onProveOwnership();
                  }}
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Verifying State */}
          {status === "verifying" && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center">
                  <Loader2 className="size-10 animate-spin text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  Verifying Ownership
                </DialogTitle>
                <DialogDescription id="ownership-verifying-description">
                  Please sign the message in your wallet and wait while we
                  verify on-chain ownership.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6">
                <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div className="h-full animate-pulse bg-primary" />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
