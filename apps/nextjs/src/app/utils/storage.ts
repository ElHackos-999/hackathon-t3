import { upload } from "thirdweb/storage";
import { serverClient } from "./thirdwebClient";

/**
 * Upload a file to IPFS using thirdweb storage
 * @param file File to upload (image, document, etc.)
 * @returns IPFS URI in the format ipfs://Qm...
 * @throws Error if upload fails
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const uris = await upload({
      client: serverClient,
      files: [file],
    });

    if (!uris || uris.length === 0) {
      throw new Error("Upload succeeded but no URI returned");
    }

    const uri = uris[0];
    if (!uri) {
      throw new Error("Upload succeeded but URI is undefined");
    }

    return uri;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(
      `Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
