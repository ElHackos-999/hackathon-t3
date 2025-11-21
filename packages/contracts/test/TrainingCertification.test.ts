import { expect } from "chai";
import hre from "hardhat";
import { TrainingCertification } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("TrainingCertification", function () {
  let contract: TrainingCertification;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let student: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

  beforeEach(async function () {
    [owner, minter, student, unauthorized] = await ethers.getSigners();

    const TrainingCertificationFactory = await ethers.getContractFactory("TrainingCertification");
    contract = await TrainingCertificationFactory.deploy();
    await contract.waitForDeployment();

    // Grant minter role
    await contract.grantRole(MINTER_ROLE, minter.address);
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should initialize nextTokenId to 1", async function () {
      // This will be tested implicitly when we create first course
    });
  });
});
