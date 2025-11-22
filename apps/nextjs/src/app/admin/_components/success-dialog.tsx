"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  transactionHash?: string;
  tokenId?: string;
  imageUrl?: string;
  explorerUrl?: string;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  transactionHash,
  tokenId,
  imageUrl,
  explorerUrl = "https://sepolia.basescan.org",
}: SuccessDialogProps) {
  const txUrl = transactionHash ? `${explorerUrl}/tx/${transactionHash}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Image Preview */}
          {imageUrl && (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="NFT Certificate"
                className="h-48 w-48 rounded-lg border-2 border-green-500 object-cover shadow-lg"
              />
            </div>
          )}

          {/* Token ID */}
          {tokenId && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                Token ID
              </p>
              <p className="font-mono text-sm break-all">{tokenId}</p>
            </div>
          )}

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                Transaction Hash
              </p>
              <p className="font-mono text-sm break-all">{transactionHash}</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          {txUrl && (
            <Button variant="outline" asChild>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                View on Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
