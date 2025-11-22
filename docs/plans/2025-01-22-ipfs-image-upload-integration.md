# IPFS Image Upload Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable automatic IPFS image upload when creating certification courses using thirdweb storage SDK.

**Architecture:** Replace text input for image URI with file upload. Server action validates file, uploads to IPFS via thirdweb storage, returns IPFS URI, then passes to smart contract. Contract stores IPFS URI and generates metadata with IPFS image reference.

**Tech Stack:** Next.js 15, React 19, thirdweb v5 SDK (storage), TypeScript, Zod validation

---

## Task 1: Update Image URI Validator to Accept IPFS Protocol

**Files:**
- Modify: `apps/nextjs/src/app/validators/certification.ts:30-33`

**Step 1: Update imageURISchema to accept ipfs:// URIs**

Replace the existing `imageURISchema` with:

```typescript
/**
 * Image URI validation (supports HTTP, HTTPS, and IPFS)
 */
export const imageURISchema = z
  .string()
  .min(1, "Image URI is required")
  .refine(
    (val) => /^(https?|ipfs):\/\/.+/.test(val),
    { message: "Must be a valid HTTP, HTTPS, or IPFS URI" }
  );
```

**Step 2: Add file validation helper function**

Add after the `imageURISchema` definition:

```typescript
/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
] as const;

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Schema for validating uploaded image files
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "File must be JPEG, PNG, GIF, or SVG",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}
```

**Step 3: Verify changes compile**

Run: `pnpm -F @acme/nextjs typecheck`

Expected: No type errors in certification validators

**Step 4: Commit**

```bash
git add apps/nextjs/src/app/validators/certification.ts
git commit -m "feat(validators): add IPFS URI support and file validation"
```

---

## Task 2: Create Storage Utility for IPFS Uploads

**Files:**
- Create: `apps/nextjs/src/app/utils/storage.ts`

**Step 1: Create storage utility file**

Create new file with complete implementation:

```typescript
import { upload } from "thirdweb/storage";
import { client } from "./thirdwebClient";

/**
 * Upload a file to IPFS using thirdweb storage
 * @param file File to upload (image, document, etc.)
 * @returns IPFS URI in the format ipfs://Qm...
 * @throws Error if upload fails
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const uris = await upload({
      client,
      files: [file],
    });

    if (!uris || uris.length === 0) {
      throw new Error("Upload succeeded but no URI returned");
    }

    return uris[0];
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(
      `Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
```

**Step 2: Verify thirdweb/storage import is available**

Run: `pnpm -F @acme/nextjs typecheck`

Expected: No import errors (thirdweb package already installed)

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/utils/storage.ts
git commit -m "feat(storage): add IPFS upload utility using thirdweb"
```

---

## Task 3: Update Server Action to Handle File Uploads

**Files:**
- Modify: `apps/nextjs/src/app/actions/certification.ts:1-84`

**Step 1: Add storage import at top of file**

Add after existing imports:

```typescript
import { uploadToIPFS } from "../utils/storage";
import { validateImageFile } from "../validators/certification";
```

**Step 2: Update createCourse function signature and implementation**

Replace the entire `createCourse` function (lines ~31-81) with:

```typescript
/**
 * Create a new certification course with automatic image upload to IPFS
 * @param courseCode Course identifier (uppercase alphanumeric)
 * @param courseName Display name for the course
 * @param imageFile Image file to upload (JPEG, PNG, GIF, or SVG, max 5MB)
 * @param validityDuration Course validity duration in seconds
 * @returns Transaction hash and token ID on success, error message on failure
 */
export async function createCourse(
  courseCode: string,
  courseName: string,
  imageFile: File,
  validityDuration: bigint,
): Promise<ActionResult<{ transactionHash: string; tokenId: bigint }>> {
  try {
    // Validate image file
    const fileValidation = validateImageFile(imageFile);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: fileValidation.error!,
      };
    }

    // Upload image to IPFS
    let imageURI: string;
    try {
      imageURI = await uploadToIPFS(imageFile);
    } catch (error) {
      return {
        success: false,
        error: `Image upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // Validate course data with IPFS URI
    const validated = createCourseSchema.parse({
      courseCode,
      courseName,
      imageURI,
      validityDuration,
    });

    // Get contract and admin account
    const contract = getTrainingCertificationContract();
    const account = getAdminAccount();

    // Prepare the transaction
    const transaction = prepareContractCall({
      contract,
      method: "createCourse",
      params: [
        validated.courseCode,
        validated.courseName,
        validated.imageURI, // IPFS URI
        validated.validityDuration,
      ],
    });

    // Send and confirm transaction
    const receipt = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    // Parse the tokenId from transaction logs
    const tokenId = BigInt(1); // TODO: Extract from logs in future enhancement

    return {
      success: true,
      data: {
        transactionHash: receipt.transactionHash,
        tokenId,
      },
    };
  } catch (error) {
    console.error("Error creating course:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create course",
    };
  }
}
```

**Step 3: Verify changes compile**

Run: `pnpm -F @acme/nextjs typecheck`

Expected: No type errors in certification actions

**Step 4: Commit**

```bash
git add apps/nextjs/src/app/actions/certification.ts
git commit -m "feat(actions): add IPFS upload to createCourse action"
```

---

## Task 4: Update Form Component for File Upload

**Files:**
- Modify: `apps/nextjs/src/app/admin/certification/_components/create-course-form.tsx:1-160`

**Step 1: Add state for file preview**

Add after the existing `result` state (around line 14):

```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
```

**Step 2: Add file change handler**

Add after the `handleSubmit` function:

```typescript
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
```

**Step 3: Update handleSubmit to use File instead of URI string**

Replace the `handleSubmit` function with:

```typescript
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
      setResult({
        success: true,
        message: `Course created successfully! Token ID: ${response.data.tokenId.toString()}, Transaction: ${response.data.transactionHash}`,
      });

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
```

**Step 4: Replace Image URI input field with file upload**

Find the Image URI Field section (around lines 92-102) and replace with:

```typescript
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
```

**Step 5: Add cleanup effect for preview URL**

Add at the end of the component, before the return statement:

```typescript
// Cleanup preview URL on unmount
React.useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

**Step 6: Verify changes compile**

Run: `pnpm -F @acme/nextjs typecheck`

Expected: No type errors in form component

**Step 7: Commit**

```bash
git add apps/nextjs/src/app/admin/certification/_components/create-course-form.tsx
git commit -m "feat(ui): add file upload with preview for course images"
```

---

## Task 5: Test Complete Flow

**Files:**
- No file changes

**Step 1: Start development server**

Run: `pnpm dev`

Expected: Server starts successfully on http://localhost:3000

**Step 2: Navigate to admin certification page**

Navigate to: `http://localhost:3000/admin/certification`

Expected: Page loads with updated form showing file upload field

**Step 3: Test file upload validation**

1. Try uploading a file larger than 5MB
   - Expected: Error message about file size
2. Try uploading a non-image file (e.g., .txt)
   - Expected: Error message about file type
3. Try submitting form without selecting a file
   - Expected: Error message "Please select an image file"

**Step 4: Test successful course creation**

1. Fill in form fields:
   - Course Code: `TEST-IPFS-101`
   - Course Name: `Test IPFS Integration`
   - Image: Select a valid PNG/JPG file (< 5MB)
   - Validity Duration: `365` days

2. Submit form

3. Expected results:
   - "Creating Course..." button shows during upload
   - Success message with transaction hash appears
   - Form resets after success
   - Preview image clears

**Step 5: Verify IPFS upload and blockchain transaction**

1. Check success message for transaction hash
2. Visit Base Sepolia explorer: `https://sepolia.basescan.org/tx/[transaction-hash]`
3. Verify transaction succeeded
4. Note the transaction should have called `createCourse` with an `ipfs://` URI

**Step 6: Verify metadata on block explorer**

1. Get the token ID from success message
2. Visit Base Sepolia explorer contract page
3. Call the `uri(tokenId)` function with your token ID
4. Verify returned metadata contains `"image":"ipfs://Qm..."`

**Step 7: Document any issues found**

If issues found, document in a new file: `docs/issues/2025-01-22-ipfs-upload-issues.md`

**Step 8: Final commit (if test adjustments made)**

```bash
git add .
git commit -m "test: verify IPFS upload integration end-to-end"
```

---

## Task 6: Update Documentation

**Files:**
- Modify: `apps/nextjs/README.md` (if exists) or create documentation

**Step 1: Document new IPFS feature**

Add section to relevant documentation:

```markdown
## IPFS Image Upload

Course badge images are automatically uploaded to IPFS when creating new courses.

### Configuration

Ensure `THIRDWEB_SECRET_KEY` is set in your `.env` file.

### File Requirements

- **Formats**: JPEG, PNG, GIF, SVG
- **Max Size**: 5MB
- **Automatic**: Upload happens server-side during course creation

### Image Storage

- Images are uploaded to IPFS via thirdweb storage
- IPFS URIs are stored in the smart contract
- Metadata references images as `ipfs://Qm...`
- OpenSea and explorers display IPFS images automatically
```

**Step 2: Commit documentation**

```bash
git add docs/ apps/nextjs/README.md
git commit -m "docs: add IPFS image upload documentation"
```

---

## Post-Implementation Notes

### Future Enhancements

1. **Extract Token ID from Logs**: Currently hardcoded to `BigInt(1)`. Should parse from transaction receipt logs.

2. **Upload Progress Indicator**: Add progress bar for IPFS upload using streaming or polling.

3. **Image Optimization**: Add image resizing/compression before upload to reduce file sizes.

4. **Bulk Upload**: Support uploading multiple course images at once.

5. **IPFS Gateway Fallback**: Store both `ipfs://` URI and gateway URL for better compatibility.

### Testing Considerations

- Test with various image sizes and formats
- Test network failure during IPFS upload
- Test concurrent uploads from multiple admins
- Verify IPFS pinning persistence over time

### Security Notes

- File validation happens both client-side (UX) and server-side (security)
- IPFS uploads use server-side secret key (never exposed to client)
- Consider adding rate limiting for upload endpoint
- Monitor thirdweb storage usage/costs

---

## Verification Checklist

- [ ] IPFS URI validator accepts `ipfs://` protocol
- [ ] File validation rejects invalid types and sizes
- [ ] Storage utility successfully uploads to IPFS
- [ ] Server action calls storage utility before contract
- [ ] Form component has file input with preview
- [ ] Preview image cleans up properly on unmount
- [ ] End-to-end flow creates course with IPFS image
- [ ] Contract metadata includes IPFS image URI
- [ ] OpenSea can display the IPFS image
- [ ] Documentation updated with new feature
