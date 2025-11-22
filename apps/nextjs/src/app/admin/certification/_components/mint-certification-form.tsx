"use client";

import { useState } from "react";
import { Button } from "@acme/ui/button";
import { Field, FieldError, FieldGroup } from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { mintCertification } from "~/app/actions/certification";

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
        setResult({
          success: true,
          message: `Certification minted successfully! Transaction: ${response.data.transactionHash}`,
        });

        // Reset form
        const form = document.getElementById(
          "mint-certification-form",
        ) as HTMLFormElement;
        form?.reset();
      } else {
        setResult({
          success: false,
          message: response.error,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "An error occurred",
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
          <FieldError>
            Token ID must be between 1 and {totalCourses}
          </FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Minting..." : "Mint Certification"}
      </Button>

      {result && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            result.success
              ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
              : "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <p className="text-sm">{result.message}</p>
        </div>
      )}
    </form>
  );
}
