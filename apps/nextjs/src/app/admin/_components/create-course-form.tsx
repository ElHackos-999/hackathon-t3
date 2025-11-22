"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@acme/ui/button";
import { Field, FieldError, FieldGroup } from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { createCourse } from "~/app/actions/certification";
import { SuccessDialog } from "./success-dialog";
import { useRouter } from "next/navigation";

export function CreateCourseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    tokenId: string;
    transactionHash: string;
  } | null>(null);


  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Extract form data
      const courseCode = formData.get("courseCode") as string;
      const courseName = formData.get("courseName") as string;
      const validityDurationDays = formData.get(
        "validityDurationDays",
      ) as string;

      // Validate file is selected
      if (!selectedFile) {
        setResult({
          success: false,
          message: "Please select an image file",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert days to seconds (BigInt)
      const validityDuration = BigInt(Number(validityDurationDays) * 86400);

      // Call server action with file
      const response = await createCourse(
        courseCode,
        courseName,
        selectedFile,
        validityDuration,
      );

      if (response.success) {
        // Set success data and show dialog
        setSuccessData({
          tokenId: response.data.tokenId.toString(),
          transactionHash: response.data.transactionHash,
        });
        setShowSuccessDialog(true);
        router.refresh();

        // Reset form and file state
        const form = document.getElementById(
          "create-course-form",
        ) as HTMLFormElement;
        form?.reset();
        setSelectedFile(null);
        setPreviewUrl(null);

        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form
      id="create-course-form"
      action={handleSubmit}
      className="space-y-4"
    >
      <FieldGroup>
        <Field>
          <Label htmlFor="courseCode">Course Code</Label>
          <Input
            id="courseCode"
            name="courseCode"
            type="text"
            placeholder="e.g., SAFETY-101"
            required
            pattern="[A-Z0-9_-]+"
            title="Uppercase alphanumeric characters, underscores, and hyphens only"
            disabled={isSubmitting}
          />
          <FieldError>
            Course code must be uppercase alphanumeric (A-Z, 0-9, _, -)
          </FieldError>
        </Field>

        <Field>
          <Label htmlFor="courseName">Course Name</Label>
          <Input
            id="courseName"
            name="courseName"
            type="text"
            placeholder="e.g., Basic Safety Training"
            required
            minLength={2}
            maxLength={100}
            disabled={isSubmitting}
          />
          <FieldError>
            Course name must be between 2 and 100 characters
          </FieldError>
        </Field>

        <Field>
          <Label htmlFor="imageFile">Course Badge Image</Label>
          <Input
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/svg+xml"
            required
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
          <FieldError>
            Image required (JPEG, PNG, GIF, or SVG, max 5MB)
          </FieldError>

          {previewUrl && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-32 rounded-lg border object-cover"
              />
            </div>
          )}
        </Field>

        <Field>
          <Label htmlFor="validityDurationDays">
            Validity Duration (days)
          </Label>
          <Input
            id="validityDurationDays"
            name="validityDurationDays"
            type="number"
            placeholder="365"
            required
            min={1}
            max={3650}
            disabled={isSubmitting}
          />
          <FieldError>
            Duration must be between 1 and 3650 days (1-10 years)
          </FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating Course..." : "Create Course"}
      </Button>

      {result && !result.success && (
        <div className="mt-4 rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Course Created Successfully!"
        description="Your certification course has been created and deployed to the blockchain."
        transactionHash={successData?.transactionHash}
        tokenId={successData?.tokenId}
      />
    </form>
  );
}
