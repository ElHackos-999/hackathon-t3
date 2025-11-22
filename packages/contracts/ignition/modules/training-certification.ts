import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * TrainingCertification Ignition Module
 *
 * Deploys the TrainingCertification ERC-1155 contract for certification NFTs.
 * The contract has no constructor parameters - the deployer is automatically
 * granted DEFAULT_ADMIN_ROLE.
 */
const TrainingCertificationModule = buildModule(
  "TrainingCertificationModule",
  (m) => {
    // Deploy TrainingCertification contract with no constructor parameters
    const trainingCertification = m.contract("TrainingCertification", []);

    return { trainingCertification };
  },
);

export default TrainingCertificationModule;
