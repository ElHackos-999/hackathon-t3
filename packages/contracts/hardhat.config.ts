import { HardhatUserConfig, task, types } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    baseSepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
    },
  },
};

export default config;

// /**
//  * The main function updates the admin and super admin roles for the GolfAuthEscrow contract.
//  * It ensures that the deployer has the necessary roles before granting the roles to a new admin
//  * and revoking them from the deployer.
//  *
//  * @throws {Error} If the private key is missing from the environment variables.
//  * @throws {Error} If the new admin address is missing from the environment variables.
//  *
//  * @remarks
//  * - The deployer must have both the admin and super admin roles to execute this script.
//  * - The new admin address is retrieved from the `ADMIN_ADDRESS` environment variable.
//  * - The script grants the admin and super admin roles to the new admin and revokes them from the deployer.
//  *
//  * @example
//  * ```bash
//  * npx hardhat --network baseSepolia update-admin-golf-auth-escrow --golf-auth-escrow-address <GOLF_AUTH_ESCROW_ADDRESS> --new-admin-address <NEW_ADMIN_ADDRESS>
//  * ```
//  */
// task("update-admin-golf-auth-escrow", "Update admin role in GolfAuthEscrow")
//   .addParam(
//     "golfAuthEscrowAddress",
//     "Address of the GolfAuthEscrow contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "newAdminAddress",
//     "Address of the new admin",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Updating admin role in GolfAuthEscrow contract at ${taskArgs.golfAuthEscrowAddress}...`,
//     );
//     const golfAuthEscrowAddress = taskArgs.golfAuthEscrowAddress;
//     const newAdminAddress = taskArgs.newAdminAddress;

//     const [DeployerProvider] = await hre.ethers.getSigners();

//     const Deployer = new hre.ethers.Wallet(
//       process.env.PRIVATE_KEY!,
//       DeployerProvider.provider,
//     );

//     const golfAuthEscrow = await hre.ethers.getContractAt(
//       "GolfAuthEscrow",
//       golfAuthEscrowAddress,
//       Deployer,
//     );
//     const adminRole = await golfAuthEscrow.DEFAULT_ADMIN_ROLE();
//     const superAdminRole = await golfAuthEscrow.SUPER_ADMIN_ROLE();

//     // Make sure the deployer has the admin role
//     const isAdminRole = await golfAuthEscrow.hasRole(
//       adminRole,
//       Deployer.address,
//     );
//     if (!isAdminRole) {
//       console.log(
//         `Deployer does not have the admin role. Address: ${Deployer.address}`,
//       );
//       return;
//     }

//     const isSuperAdminRole = await golfAuthEscrow.hasRole(
//       superAdminRole,
//       Deployer.address,
//     );
//     if (!isSuperAdminRole) {
//       console.log(
//         `Deployer does not have the super admin role. Address: ${Deployer.address}`,
//       );
//       return;
//     }

//     if (!newAdminAddress) {
//       throw new Error("Missing new admin address");
//     }
//     const tx = await golfAuthEscrow.grantRole(adminRole, newAdminAddress);
//     console.log(`Granting admin role to ${newAdminAddress}...`);
//     await tx.wait(2);
//     console.log(
//       `Admin role granted to ${newAdminAddress}. Transaction hash: ${tx.hash}`,
//     );

//     const tx2 = await golfAuthEscrow.grantRole(superAdminRole, newAdminAddress);
//     console.log(`Granting super admin role to ${newAdminAddress}...`);
//     await tx2.wait(2);
//     console.log(
//       `Super admin role granted to ${newAdminAddress}. Transaction hash: ${tx2.hash}`,
//     );
//     // Check if the new admin has the role
//     const newAdminHasRole = await golfAuthEscrow.hasRole(
//       adminRole,
//       newAdminAddress,
//     );
//     const newAdminHasSuperRole = await golfAuthEscrow.hasRole(
//       superAdminRole,
//       newAdminAddress,
//     );

//     if (newAdminHasRole && newAdminHasSuperRole) {
//       console.log(
//         `New admin ${newAdminAddress} has the admin role. Transaction hash: ${tx.hash}`,
//       );
//       // Revoke the admin role from the deployer
//       const revokeTx = await golfAuthEscrow.revokeRole(
//         adminRole,
//         Deployer.address,
//       );
//       console.log(`Revoking admin role from ${Deployer.address}...`);
//       await revokeTx.wait(2);
//       console.log(
//         `Admin role revoked from ${Deployer.address}. Transaction hash: ${revokeTx.hash}`,
//       );
//       // Revoke the super admin role from the deployer
//       const revokeSuperTx = await golfAuthEscrow.revokeRole(
//         superAdminRole,
//         Deployer.address,
//       );
//       console.log(`Revoking super admin role from ${Deployer.address}...`);
//       await revokeSuperTx.wait(2);
//       console.log(
//         `Super admin role revoked from ${Deployer.address}. Transaction hash: ${revokeSuperTx.hash}`,
//       );
//     } else {
//       console.log(
//         `New admin ${newAdminAddress} does not have an admin role. Transaction hash: ${tx.hash}`,
//       );
//     }
//   });

// /**
//  * The main function updates the admin role for the GolfAuthNFT contract.
//  * It ensures the deployer has the admin role, grants the admin role to a new address,
//  * and revokes the admin role from the deployer after the new admin is successfully assigned.
//  *
//  * @throws {Error} If the private key or new admin address is missing.
//  * @throws {Error} If the deployer does not have the admin role.
//  *
//  * Steps:
//  * 1. Retrieves the deployer's signer and wallet using the private key.
//  * 2. Connects to the GolfAuthNFT contract using its address and the deployer's wallet.
//  * 3. Verifies that the deployer has the admin role.
//  * 4. Grants the admin role to the new admin address provided in the environment variable `ADMIN_ADDRESS`.
//  * 5. Confirms the new admin has the admin role.
//  * 6. Revokes the admin role from the deployer if the new admin assignment is successful.
//  *
//  * @example
//  * ```bash
//  * npx hardhat --network baseSepolia update-admin-golf-auth-nft --golf-auth-nft-address <GOLF_AUTH_NFT_ADDRESS> --new-admin-address <NEW_ADMIN_ADDRESS>
//  * ```
//  */
// task("update-admin-golf-auth-nft", "Update admin role in GolfAuthNFT")
//   .addParam(
//     "golfAuthNftAddress",
//     "Address of the GolfAuthNFT contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "newAdminAddress",
//     "Address of the new admin",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Updating admin role in GolfAuthNFT contract at ${taskArgs.golfAuthNftAddress}...`,
//     );
//     const golfAuthNftAddress = taskArgs.golfAuthNftAddress;
//     const newAdminAddress = taskArgs.newAdminAddress;

//     const [DeployerProvider] = await hre.ethers.getSigners();

//     const Deployer = new hre.ethers.Wallet(
//       process.env.PRIVATE_KEY!,
//       DeployerProvider.provider,
//     );

//     const golfAuthNft = await hre.ethers.getContractAt(
//       "GolfAuthNFT",
//       golfAuthNftAddress,
//       Deployer,
//     );
//     const adminRole = await golfAuthNft.DEFAULT_ADMIN_ROLE();

//     // Make sure the deployer has the admin role
//     const hasRole = await golfAuthNft.hasRole(adminRole, Deployer.address);
//     if (!hasRole) {
//       console.log(
//         `Deployer does not have the admin role. Address: ${Deployer.address}`,
//       );
//       return;
//     }

//     if (!newAdminAddress) {
//       throw new Error("Missing new admin address");
//     }
//     const tx = await golfAuthNft.grantRole(adminRole, newAdminAddress);
//     console.log(`Granting admin role to ${newAdminAddress}...`);
//     await tx.wait(2);
//     console.log(
//       `Admin role granted to ${newAdminAddress}. Transaction hash: ${tx.hash}`,
//     );

//     // Check if the new admin has the role
//     const newAdminHasRole = await golfAuthNft.hasRole(
//       adminRole,
//       newAdminAddress,
//     );

//     if (newAdminHasRole) {
//       console.log(
//         `New admin ${newAdminAddress} has the admin role. Transaction hash: ${tx.hash}`,
//       );
//       // Revoke the admin role from the deployer
//       const revokeTx = await golfAuthNft.revokeRole(
//         adminRole,
//         Deployer.address,
//       );
//       console.log(`Revoking admin role from ${Deployer.address}...`);
//       await revokeTx.wait(2);
//       console.log(
//         `Admin role revoked from ${Deployer.address}. Transaction hash: ${revokeTx.hash}`,
//       );
//     } else {
//       console.log(
//         `New admin ${newAdminAddress} does not have an admin role. Transaction hash: ${tx.hash}`,
//       );
//     }
//   });

// /**
//  * Grants the minter role to a specified address for the GolfAuthNFT contract.
//  *
//  * This script performs the following steps:
//  * 1. Retrieves the deployer and admin wallets using private keys from environment variables.
//  * 2. Connects to the GolfAuthNFT contract using the deployer wallet.
//  * 3. Verifies that the admin wallet has the admin role on the contract.
//  * 4. Grants the minter role to a specified address using the admin wallet.
//  * 5. Confirms that the specified address has been successfully granted the minter role.
//  *
//  * @throws {Error} If the required private keys are not provided in the environment variables.
//  * @throws {Error} If the admin wallet does not have the admin role on the contract.
//  *
//  * @remarks
//  * - The script uses Hardhat Runtime Environment (hre) to interact with the Ethereum blockchain.
//  * - Ensure that the `PRIVATE_KEY` and `ADMIN_PRIVATE_KEY` environment variables are set before running the script.
//  * - The `golfAuthNftAddress` and `newMinterAddress` should be updated as needed.
//  *
//  * @example
//  * To run the script:
//  * ```bash
//  * npx hardhat --network baseSepolia grant-minter-role --golf-auth-nft-address <GOLF_AUTH_NFT_ADDRESS> --new-minter-address <NEW_MINTER_ADDRESS>
//  * ```
//  */
// task("grant-minter-role", "Grant minter role in GolfAuthNFT")
//   .addParam(
//     "golfAuthNftAddress",
//     "Address of the GolfAuthNFT contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "newMinterAddress",
//     "Address of the new minter",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Granting minter role in GolfAuthNFT contract at ${taskArgs.golfAuthNftAddress}...`,
//     );
//     const golfAuthNftAddress = taskArgs.golfAuthNftAddress;
//     const newMinterAddress = taskArgs.newMinterAddress;

//     const [DeployerProvider] = await hre.ethers.getSigners();

//     const Deployer = new hre.ethers.Wallet(
//       process.env.ADMIN_PRIVATE_KEY!,
//       DeployerProvider.provider,
//     );

//     const golfAuthNft = await hre.ethers.getContractAt(
//       "GolfAuthNFT",
//       golfAuthNftAddress,
//       Deployer,
//     );
//     const adminRole = await golfAuthNft.DEFAULT_ADMIN_ROLE();
//     const minterRole = await golfAuthNft.MINTER_ROLE();

//     // Make sure the deployer has the admin role
//     const hasRole = await golfAuthNft.hasRole(adminRole, Deployer.address);
//     if (!hasRole) {
//       console.log(
//         `Deployer does not have the admin role. Address: ${Deployer.address}`,
//       );
//       return;
//     }

//     if (!newMinterAddress) {
//       throw new Error("Missing new minter address");
//     }
//     const tx = await golfAuthNft.grantRole(minterRole, newMinterAddress);
//     console.log(`Granting minter role to ${newMinterAddress}...`);
//     await tx.wait(2);
//     console.log(
//       `Minter role granted to ${newMinterAddress}. Transaction hash: ${tx.hash}`,
//     );

//     // Check if the new minter has the role
//     const newMinterHasRole = await golfAuthNft.hasRole(
//       minterRole,
//       newMinterAddress,
//     );

//     if (newMinterHasRole) {
//       console.log(
//         `New minter ${newMinterAddress} has the minter role. Transaction hash: ${tx.hash}`,
//       );
//     } else {
//       console.log(
//         `New minter ${newMinterHasRole} does not have the minter role. Transaction hash: ${tx.hash}`,
//       );
//     }
//   });

// /**
//  * Main function to release a token from the escrow contract to a specified address.
//  *
//  * This script interacts with the `GolfAuthEscrow` smart contract to release a token
//  * identified by its `TOKEN_ID` to a new claimant address (`RELEASE_TO`). The script
//  * requires an admin private key to authorize the transaction.
//  *
//  * Environment Variables:
//  * - `ADMIN_PRIVATE_KEY`: The private key of the admin account used to sign the transaction.
//  *
//  * Constants to Configure:
//  * - `ESCROW_ADDRESS`: The address of the deployed `GolfAuthEscrow` contract.
//  * - `TOKEN_ID`: The ID of the token to be released.
//  * - `RELEASE_TO`: The address of the new claimant to receive the token.
//  *
//  * Steps:
//  * 1. Validates that the `ADMIN_PRIVATE_KEY` is provided.
//  * 2. Initializes the admin wallet using the private key and connects it to the provider.
//  * 3. Retrieves the `GolfAuthEscrow` contract instance at the specified `ESCROW_ADDRESS`.
//  * 4. Logs the release operation details.
//  * 5. Executes the `release` function on the contract to transfer the token.
//  * 6. Waits for the transaction to be mined and logs the transaction hash upon success.
//  *
//  * @throws {Error} If the `ADMIN_PRIVATE_KEY` is not provided.
//  *
//  * @example
//  * ```bash
//  * npx hardhat --network baseSepolia release-token-escrow --escrow-address <ESCROW_ADDRESS> --token-id <TOKEN_ID> --release-to <RELEASE_TO>
//  * ```
//  */
// task("release-token-escrow", "Release token from GolfAuthEscrow")
//   .addParam(
//     "escrowAddress",
//     "Address of the GolfAuthEscrow contract",
//     undefined,
//     types.string,
//   )
//   .addParam("tokenId", "ID of the token to release", undefined, types.int)
//   .addParam(
//     "releaseTo",
//     "Address of the new claimant to receive the token",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Releasing token from GolfAuthEscrow contract at ${taskArgs.escrowAddress}...`,
//     );
//     const escrowAddress = taskArgs.escrowAddress;
//     const tokenId = taskArgs.tokenId;
//     const releaseTo = taskArgs.releaseTo;

//     const [providerSigner] = await hre.ethers.getSigners();

//     const admin = new hre.ethers.Wallet(
//       process.env.ADMIN_PRIVATE_KEY!,
//       providerSigner.provider,
//     );

//     const escrow = await hre.ethers.getContractAt(
//       "GolfAuthEscrow",
//       escrowAddress,
//       admin,
//     );

//     /* auth check identical to previous scripts */

//     console.log(`Releasing token #${tokenId} to ${releaseTo}...`);
//     const tx = await escrow.release(tokenId, releaseTo);
//     await tx.wait(2);
//     console.log(`✅  Released.  TxHash: ${tx.hash}`);
//   });

// /**
//  * Main function to set the expiry status of a token in the GolfAuthEscrow contract.
//  *
//  * This script interacts with the GolfAuthEscrow smart contract to update the expiry
//  * status of a specific token. It requires the admin's private key and other necessary
//  * parameters to execute the transaction.
//  *
//  * @throws {Error} If the `ADMIN_PRIVATE_KEY` environment variable is not provided.
//  * @throws {Error} If required parameters such as `ESCROW_ADDRESS`, `TOKEN_ID`, or `EXPIRED` are missing.
//  *
//  *
//  * @example
//  * ```bash
//  * npx hardhat --network baseSepolia set-expiry-status-escrow --escrow-address <ESCROW_ADDRESS> --token-id <TOKEN_ID> --expired <EXPIRED>
//  * ```
//  */
// task("set-expiry-status-escrow", "Set expiry status in GolfAuthEscrow")
//   .addParam(
//     "escrowAddress",
//     "Address of the GolfAuthEscrow contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "tokenId",
//     "ID of the token to set expiry status",
//     undefined,
//     types.int,
//   )
//   .addParam("expired", "Expiry status (true/false)", undefined, types.boolean)
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Setting expiry status in GolfAuthEscrow contract at ${taskArgs.escrowAddress}...`,
//     );
//     const escrowAddress = taskArgs.escrowAddress;
//     const tokenId = taskArgs.tokenId;
//     const expired = taskArgs.expired;

//     const [providerSigner] = await hre.ethers.getSigners();

//     const admin = new hre.ethers.Wallet(
//       process.env.ADMIN_PRIVATE_KEY!,
//       providerSigner.provider,
//     );

//     const escrow = await hre.ethers.getContractAt(
//       "GolfAuthEscrow",
//       escrowAddress,
//       admin,
//     );

//     /* auth check identical to previous scripts */

//     console.log(`Setting expiry status of token #${tokenId} to ${expired}...`);
//     const tx = await escrow.setExpiryStatus(tokenId, expired);
//     await tx.wait(2);
//     console.log(`✅  Status set.  TxHash: ${tx.hash}`);
//   });

// /**
//  * Main function to execute the claim process for a token from the GolfAuthEscrow contract.
//  *
//  * This script performs the following steps:
//  * 1. Validates the presence of required environment variables.
//  * 2. Initializes the admin wallet using the provided private key.
//  * 3. Connects to the deployed GolfAuthEscrow contract.
//  * 4. Verifies that the caller has the necessary roles (SUPER_ADMIN or AUTHORISED_ADMIN).
//  * 5. Executes the `claim` function on the contract for the specified token ID.
//  *
//  * @throws {Error} If required environment variables are missing.
//  * @throws {Error} If the caller does not have the required roles to execute the claim.
//  * @throws {Error} If the token ID or escrow contract address is not provided.
//  *
//  * @example
//  * ```bash
//  * npx hardhat --network baseSepolia claim-escrow --escrow-address <ESCROW_ADDRESS> --token-id <TOKEN_ID>
//  * ```
//  */
// task("claim-escrow", "Claim token from GolfAuthEscrow")
//   .addParam(
//     "escrowAddress",
//     "Address of the GolfAuthEscrow contract",
//     undefined,
//     types.string,
//   )
//   .addParam("tokenId", "ID of the token to claim", undefined, types.int)
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Claiming token from GolfAuthEscrow contract at ${taskArgs.escrowAddress}...`,
//     );
//     const escrowAddress = taskArgs.escrowAddress;
//     const tokenId = taskArgs.tokenId;

//     const [providerSigner] = await hre.ethers.getSigners();

//     const admin = new hre.ethers.Wallet(
//       process.env.ADMIN_PRIVATE_KEY!,
//       providerSigner.provider,
//     );

//     const escrow = await hre.ethers.getContractAt(
//       "GolfAuthEscrow",
//       escrowAddress,
//       admin,
//     );

//     /* -------------------------------------------------------------------------- */
//     /*  Pre-flight: make sure caller is authorised                                */
//     /* -------------------------------------------------------------------------- */
//     const adminRole = await escrow.SUPER_ADMIN_ROLE(); // same as DEFAULT_ADMIN
//     const authorisedRole = await escrow.AUTHORISED_ADMIN_ROLE();

//     const hasPower =
//       (await escrow.hasRole(adminRole, admin.address)) ||
//       (await escrow.hasRole(authorisedRole, admin.address));

//     if (!hasPower) {
//       throw new Error(
//         `Caller ${admin.address} is neither SUPER_ADMIN nor AUTHORISED_ADMIN`,
//       );
//     }

//     /* auth check identical to previous scripts */

//     console.log(`Claiming token #${tokenId}...`);
//     const tx = await escrow.claim(tokenId);
//     await tx.wait(2);
//     console.log(`✅  Claimed.  TxHash: ${tx.hash}`);
//   });

/**
 * Main function to update the claimant of a specific token in the GolfAuthEscrow contract.
 *
 * This script performs the following steps:
 * 1. Validates the presence of the required environment variable `ADMIN_PRIVATE_KEY`.
 * 2. Connects to the Ethereum network using the provided admin private key.
 * 3. Retrieves the GolfAuthEscrow contract instance at the specified address.
 * 4. Checks if the caller has the necessary roles (`SUPER_ADMIN_ROLE` or `AUTHORISED_ADMIN_ROLE`)
 *    to perform the update.
 * 5. Updates the claimant of the specified token to the new claimant address.
 *
 * @throws {Error} If `ADMIN_PRIVATE_KEY` is not provided in the environment variables.
 * @throws {Error} If the caller does not have the required roles to perform the update.
 *
 * @remarks
 * Ensure that the following variables are properly set before running the script:
 * - `ESCROW_ADDRESS`: The address of the GolfAuthEscrow contract.
 * - `TOKEN_ID`: The ID of the token whose claimant is to be updated.
 * - `NEW_CLAIMANT`: The address of the new claimant.
 *
 * @example
 * ```bash
 * npx hardhat --network baseSepolia update-claimant-escrow --escrow-address <ESCROW_ADDRESS> --token-id <TOKEN_ID> --new-claimant <NEW_CLAIMANT>
 * ```
 */
// task("update-claimant-escrow", "Update claimant in GolfAuthEscrow")
//   .addParam(
//     "escrowAddress",
//     "Address of the GolfAuthEscrow contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "tokenId",
//     "ID of the token to update claimant",
//     undefined,
//     types.int,
//   )
//   .addParam(
//     "newClaimant",
//     "Address of the new claimant",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Updating claimant in GolfAuthEscrow contract at ${taskArgs.escrowAddress}...`,
//     );
//     const escrowAddress = taskArgs.escrowAddress;
//     const tokenId = taskArgs.tokenId;
//     const newClaimant = taskArgs.newClaimant;

//     const [providerSigner] = await hre.ethers.getSigners();

//     const admin = new hre.ethers.Wallet(
//       process.env.ADMIN_PRIVATE_KEY!,
//       providerSigner.provider,
//     );

//     const escrow = await hre.ethers.getContractAt(
//       "GolfAuthEscrow",
//       escrowAddress,
//       admin,
//     );

//     /* -------------------------------------------------------------------------- */
//     /*  Pre-flight: make sure caller is authorised                                */
//     /* -------------------------------------------------------------------------- */
//     const adminRole = await escrow.SUPER_ADMIN_ROLE(); // same as DEFAULT_ADMIN
//     const authorisedRole = await escrow.AUTHORISED_ADMIN_ROLE();

//     const hasPower =
//       (await escrow.hasRole(adminRole, admin.address)) ||
//       (await escrow.hasRole(authorisedRole, admin.address));

//     if (!hasPower) {
//       throw new Error(
//         `Caller ${admin.address} is neither SUPER_ADMIN nor AUTHORISED_ADMIN`,
//       );
//     }

//     /* auth check identical to previous scripts */

//     console.log(`Updating claimant of token #${tokenId} to ${newClaimant}...`);
//     const tx = await escrow.updateClaimant(tokenId, newClaimant);
//     await tx.wait(2);
//     console.log(`✅  Updated.  TxHash: ${tx.hash}`);
//   });

// task("check-minter-role", "Check minter role in GolfAuthNFT")
//   .addParam(
//     "golfAuthNftAddress",
//     "Address of the GolfAuthNFT contract",
//     undefined,
//     types.string,
//   )
//   .addParam(
//     "minterAddress",
//     "Address of the minter to check",
//     undefined,
//     types.string,
//   )
//   .setAction(async (taskArgs, hre) => {
//     console.log(
//       `Checking minter role in GolfAuthNFT contract at ${taskArgs.golfAuthNftAddress}...`,
//     );
//     const golfAuthNftAddress = taskArgs.golfAuthNftAddress;
//     const minterAddress = taskArgs.minterAddress;

//     const [DeployerProvider] = await hre.ethers.getSigners();

//     const Deployer = new hre.ethers.Wallet(
//       process.env.PRIVATE_KEY!,
//       DeployerProvider.provider,
//     );

//     const golfAuthNft = await hre.ethers.getContractAt(
//       "GolfAuthNFT",
//       golfAuthNftAddress,
//       Deployer,
//     );
//     const minterRole = await golfAuthNft.MINTER_ROLE();

//     // Check if the minter has the role
//     const newMinterHasRole = await golfAuthNft.hasRole(
//       minterRole,
//       minterAddress,
//     );

//     if (newMinterHasRole) {
//       console.log(`Minter ${minterAddress} has the minter role. `);
//     } else {
//       console.log(`Minter ${minterAddress} does not have the minter role. `);
//     }
//   });
