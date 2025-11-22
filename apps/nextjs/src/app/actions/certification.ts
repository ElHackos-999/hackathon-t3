"use server";

import {
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
} from "thirdweb";

import type {
  BatchMintCertificationsInput,
  CreateCourseInput,
  MintCertificationInput,
  UpdateCourseInput,
} from "../validators/certification";
import { getAdminAccount } from "../utils/adminAccount";
import { getTrainingCertificationContract } from "../utils/contract";
import { uploadToIPFS } from "../utils/storage";
import {
  batchMintCertificationsSchema,
  createCourseSchema,
  mintCertificationSchema,
  updateCourseSchema,
  validateImageFile,
} from "../validators/certification";

/**
 * Generic action result type for error handling
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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
        error: fileValidation.error ?? "Invalid image file format",
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
      error: error instanceof Error ? error.message : "Failed to create course",
    };
  }
}

/**
 * Update an existing certification course
 * @param input Course update parameters
 * @returns Transaction hash on success, error message on failure
 */
export async function updateCourse(
  input: UpdateCourseInput,
): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    // Validate input
    const validated = updateCourseSchema.parse(input);

    // Get contract and admin account
    const contract = getTrainingCertificationContract();
    const account = getAdminAccount();

    // Prepare the transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transaction = prepareContractCall({
      contract,
      method: "updateCourse",
      params: [
        validated.tokenId,
        validated.courseName ?? "",
        validated.imageURI ?? "",
        validated.validityDuration ?? BigInt(0),
      ],
    });

    // Send and confirm transaction
    const receipt = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    return {
      success: true,
      data: { transactionHash: receipt.transactionHash },
    };
  } catch (error) {
    console.error("Error updating course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update course",
    };
  }
}

/**
 * Get the total number of courses created
 * @returns Total number of courses
 */
export async function getTotalCourses(): Promise<ActionResult<bigint>> {
  try {
    const contract = getTrainingCertificationContract();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalCourses = (await readContract({
      contract,
      method: "getTotalCourses",
      params: [],
    })) as unknown as bigint;

    return {
      success: true,
      data: totalCourses,
    };
  } catch (error) {
    console.error("Error getting total courses:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get total courses",
    };
  }
}

//0x610d77f7cf6921de443c56bb6de6e8ef5f29a979095aaa883c514a593663974c

/**
 * Get course details by token ID
 * @param tokenId The token ID of the course
 * @returns Course details
 */
export async function getCourse(tokenId: bigint): Promise<
  ActionResult<{
    courseCode: string;
    courseName: string;
    imageURI: string;
    validityDuration: bigint;
    exists: boolean;
  }>
> {
  try {
    const contract = getTrainingCertificationContract();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = await readContract({
      contract,
      method: "getCourse",
      params: [tokenId],
    });

    console.log("Fetched course:", course);

    return {
      success: true,
      data: course,
    };
  } catch (error) {
    console.error("Error getting course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get course",
    };
  }
}

/**
 * Mint a certification to a single recipient
 * @param input Minting parameters
 * @returns Transaction hash on success, error message on failure
 */
export async function mintCertification(
  input: MintCertificationInput,
): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    // Validate input
    const validated = mintCertificationSchema.parse(input);

    // Get contract and admin account
    const contract = getTrainingCertificationContract();
    const account = getAdminAccount();

    // Prepare the transaction
    const transaction = prepareContractCall({
      contract,
      method: "mintCertification",
      params: [validated.to, validated.tokenId, "0x"],
    });

    // Send and confirm transaction
    const receipt = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    return {
      success: true,
      data: { transactionHash: receipt.transactionHash },
    };
  } catch (error) {
    console.error("Error minting certification:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mint certification",
    };
  }
}

/**
 * Mint certifications to multiple recipients
 * @param input Batch minting parameters
 * @returns Transaction hash on success, error message on failure
 */
export async function batchMintCertifications(
  input: BatchMintCertificationsInput,
): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    // Validate input
    const validated = batchMintCertificationsSchema.parse(input);

    // Get contract and admin account
    const contract = getTrainingCertificationContract();
    const account = getAdminAccount();

    // Prepare the transaction
    const transaction = prepareContractCall({
      contract,
      method: "batchMintCertifications",
      params: [validated.recipients, validated.tokenId, "0x"],
    });

    // Send and confirm transaction
    const receipt = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    return {
      success: true,
      data: { transactionHash: receipt.transactionHash },
    };
  } catch (error) {
    console.error("Error batch minting certifications:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to batch mint certifications",
    };
  }
}

/**
 * Check if a certification is valid (not expired)
 * @param tokenId The token ID of the course
 * @param holder The address of the certification holder
 * @returns Whether the certification is valid
 */
export async function isValidCertification(
  tokenId: bigint,
  holder: string,
): Promise<ActionResult<boolean>> {
  try {
    const contract = getTrainingCertificationContract();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await readContract({
      contract,
      method: "isValid",
      params: [tokenId, holder],
    });

    return {
      success: true,
      data: isValid,
    };
  } catch (error) {
    console.error("Error checking certification validity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check certification validity",
    };
  }
}

/**
 * Get the mint timestamp for a certification
 * @param tokenId The token ID of the course
 * @param holder The address of the certification holder
 * @returns The Unix timestamp when the certification was minted
 */
export async function getMintTimestamp(
  tokenId: bigint,
  holder: string,
): Promise<ActionResult<bigint>> {
  try {
    const contract = getTrainingCertificationContract();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timestamp = await readContract({
      contract,
      method: "getMintTimestamp",
      params: [tokenId, holder],
    });

    return {
      success: true,
      data: timestamp,
    };
  } catch (error) {
    console.error("Error getting mint timestamp:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get mint timestamp",
    };
  }
}
