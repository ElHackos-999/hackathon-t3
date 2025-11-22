import { env } from "process";
import { createThirdwebClient } from "thirdweb";
import { upload } from "thirdweb/storage";

export const serverClient = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY ?? "",
});

/**
 * Upload a file to IPFS using thirdweb storage
 * @param file File to upload (image, document, etc.)
 * @returns IPFS URI in the format ipfs://Qm...
 * @throws Error if upload fails
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const uri = await upload({
      client: serverClient,
      files: [file],
    });

    if (!uri || typeof uri !== "string") {
      throw new Error("Upload succeeded but no URI returned");
    }

    // Thirdweb already returns properly formatted ipfs:// URIs for single files
    if (!uri.startsWith("ipfs://")) {
      throw new Error(`Invalid IPFS URI format: ${uri}`);
    }

    return uri;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(
      `Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
