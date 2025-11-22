"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";
import { Field, FieldError, FieldGroup } from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { mintCertification } from "~/app/actions/certification";
import { SuccessDialog } from "./success-dialog";

interface MintCertificationFormProps {
  totalCourses: number;
}

export function MintCertificationForm({
  totalCourses,
}: MintCertificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    transactionHash: string;
    recipientAddress: string;
    tokenId: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Extract form data
      const to = formData.get("to") as string;
      const tokenId = BigInt(formData.get("tokenId") as string);

      // Call server action
      const response = await mintCertification({
        to,
        tokenId,
      });

      if (response.success) {
        // Set success data and show dialog
        setSuccessData({
          transactionHash: response.data.transactionHash,
          recipientAddress: to,
          tokenId: tokenId.toString(),
        });
        setShowSuccessDialog(true);

        // Reset form
        const form = document.getElementById(
          "mint-certification-form",
        ) as HTMLFormElement;
        form.reset();
      } else {
        setResult({
          success: false,
          message: response.error,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="mint-certification-form"
      action={handleSubmit}
      className="space-y-4"
    >
      <FieldGroup>
        <Field>
          <Label htmlFor="to">Recipient Address</Label>
          <Input
            id="to"
            name="to"
            type="text"
            placeholder="0x..."
            required
            pattern="^0x[a-fA-F0-9]{40}$"
            title="Must be a valid Ethereum address"
            disabled={isSubmitting}
          />
          <FieldError>Must be a valid Ethereum address</FieldError>
        </Field>

        <Field>
          <Label htmlFor="tokenId">Course Token ID</Label>
          <Input
            id="tokenId"
            name="tokenId"
            type="number"
            placeholder="1"
            required
            min={1}
            max={totalCourses}
            disabled={isSubmitting}
          />
          <FieldError>Token ID must be between 1 and {totalCourses}</FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Minting..." : "Mint Certification"}
      </Button>

      {result && !result.success && (
        <div className="mt-4 rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Certification Minted Successfully!"
        description={`NFT certification has been minted to ${successData?.recipientAddress.slice(0, 6)}...${successData?.recipientAddress.slice(-4)}`}
        transactionHash={successData?.transactionHash}
        tokenId={successData?.tokenId}
      />
    </form>
  );
}
