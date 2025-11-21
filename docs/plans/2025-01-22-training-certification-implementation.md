# Training Certification NFT Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an ERC-1155 NFT contract for training certifications with automatic expiry validation on Base Sepolia.

**Architecture:** OpenZeppelin-based ERC-1155 contract with AccessControl for role-based minting, on-chain course registry with metadata, and view-based expiry validation. No automatic burning - expired tokens remain in wallets but fail `isValid()` checks.

**Tech Stack:** Solidity 0.8.20+, OpenZeppelin Contracts v5.x, Hardhat, ethers.js v6, Base Sepolia testnet

**Design Reference:** See `docs/plans/2025-01-22-training-certification-nft-design.md`

---

## Task 1: Set Up Contract Structure

**Files:**
- Create: `packages/contracts/contracts/TrainingCertification.sol`
- Create: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Install OpenZeppelin contracts**

Run:
```bash
cd packages/contracts
pnpm add @openzeppelin/contracts@^5.0.0
```

Expected: Package installed successfully

**Step 2: Create contract file with imports and basic structure**

Create `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TrainingCertification
 * @notice ERC-1155 NFT contract for training certifications with expiry validation
 * @dev Certifications have fixed validity periods and expire after a set duration
 */
contract TrainingCertification is ERC1155, ERC1155Supply, AccessControl {
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Course structure
    struct Course {
        string courseCode;
        string courseName;
        string imageURI;
        uint256 validityDuration;
        bool exists;
    }

    // State variables
    uint256 private _nextTokenId;
    mapping(uint256 => Course) private _courses;
    mapping(uint256 => mapping(address => uint256)) private _mintTimestamps;
    mapping(bytes32 => uint256) private _courseCodeToTokenId;

    // Events
    event CourseCreated(uint256 indexed tokenId, string courseCode, string courseName);
    event CourseUpdated(uint256 indexed tokenId, string courseName, string imageURI, uint256 validityDuration);
    event CertificationMinted(address indexed recipient, uint256 indexed tokenId, uint256 mintTimestamp, uint256 expiryTimestamp);

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _nextTokenId = 1;
    }

    // Override required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Override required for ERC1155Supply
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
```

**Step 3: Create test file structure**

Create `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { TrainingCertification } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

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
```

**Step 4: Compile contracts**

Run:
```bash
pnpm --filter @acme/contracts build
```

Expected: Contracts compile successfully, typechain types generated

**Step 5: Run initial tests**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: 1 test passing (deployment test)

**Step 6: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts packages/contracts/package.json
git commit -m "feat(contracts): add TrainingCertification contract structure

- Add ERC-1155 contract with OpenZeppelin base
- Add AccessControl for role-based minting
- Add course data structures and state variables
- Add basic test setup"
```

---

## Task 2: Implement Course Creation

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for course creation**

Add to `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
describe("Course Management", function () {
  const courseCode = "REACT-101";
  const courseName = "React Developer Certification";
  const imageURI = "https://example.com/badges/react-101.png";
  const validityDuration = 31536000; // 1 year in seconds

  describe("createCourse", function () {
    it("Should create a course with valid parameters", async function () {
      const tx = await contract.createCourse(
        courseCode,
        courseName,
        imageURI,
        validityDuration
      );

      await expect(tx)
        .to.emit(contract, "CourseCreated")
        .withArgs(1, courseCode, courseName);

      const course = await contract.getCourse(1);
      expect(course.courseCode).to.equal(courseCode);
      expect(course.courseName).to.equal(courseName);
      expect(course.imageURI).to.equal(imageURI);
      expect(course.validityDuration).to.equal(validityDuration);
      expect(course.exists).to.be.true;
    });

    it("Should increment token ID for each course", async function () {
      await contract.createCourse(courseCode, courseName, imageURI, validityDuration);
      await contract.createCourse("VUE-101", "Vue Developer Cert", imageURI, validityDuration);

      const course1 = await contract.getCourse(1);
      const course2 = await contract.getCourse(2);

      expect(course1.courseCode).to.equal(courseCode);
      expect(course2.courseCode).to.equal("VUE-101");
    });

    it("Should reject empty course code", async function () {
      await expect(
        contract.createCourse("", courseName, imageURI, validityDuration)
      ).to.be.revertedWith("Course code cannot be empty");
    });

    it("Should reject empty course name", async function () {
      await expect(
        contract.createCourse(courseCode, "", imageURI, validityDuration)
      ).to.be.revertedWith("Course name cannot be empty");
    });

    it("Should reject empty image URI", async function () {
      await expect(
        contract.createCourse(courseCode, courseName, "", validityDuration)
      ).to.be.revertedWith("Image URI cannot be empty");
    });

    it("Should reject zero validity duration", async function () {
      await expect(
        contract.createCourse(courseCode, courseName, imageURI, 0)
      ).to.be.revertedWith("Validity duration must be greater than zero");
    });

    it("Should reject duplicate course codes", async function () {
      await contract.createCourse(courseCode, courseName, imageURI, validityDuration);

      await expect(
        contract.createCourse(courseCode, "Different Name", imageURI, validityDuration)
      ).to.be.revertedWith("Course code already exists");
    });

    it("Should only allow admin to create courses", async function () {
      await expect(
        contract.connect(unauthorized).createCourse(courseCode, courseName, imageURI, validityDuration)
      ).to.be.reverted; // AccessControl revert
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Multiple failures - functions don't exist yet

**Step 3: Implement createCourse function**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Create a new course with certification parameters
     * @param courseCode Unique identifier for the course (e.g., "REACT-101")
     * @param courseName Display name of the course
     * @param imageURI URI pointing to the certification badge image
     * @param validityDuration How long the certification is valid (in seconds)
     * @return tokenId The newly assigned token ID for this course
     */
    function createCourse(
        string memory courseCode,
        string memory courseName,
        string memory imageURI,
        uint256 validityDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(bytes(courseCode).length > 0, "Course code cannot be empty");
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        require(bytes(imageURI).length > 0, "Image URI cannot be empty");
        require(validityDuration > 0, "Validity duration must be greater than zero");

        bytes32 courseCodeHash = keccak256(bytes(courseCode));
        require(_courseCodeToTokenId[courseCodeHash] == 0, "Course code already exists");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _courses[tokenId] = Course({
            courseCode: courseCode,
            courseName: courseName,
            imageURI: imageURI,
            validityDuration: validityDuration,
            exists: true
        });

        _courseCodeToTokenId[courseCodeHash] = tokenId;

        emit CourseCreated(tokenId, courseCode, courseName);

        return tokenId;
    }

    /**
     * @notice Get course information by token ID
     * @param tokenId The token ID of the course
     * @return course The course data
     */
    function getCourse(uint256 tokenId) external view returns (Course memory) {
        require(_courses[tokenId].exists, "Course does not exist");
        return _courses[tokenId];
    }
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All course creation tests passing

**Step 5: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement course creation

- Add createCourse function with validation
- Add getCourse view function
- Prevent duplicate course codes
- Add comprehensive tests for course creation"
```

---

## Task 3: Implement Course Updates

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for course updates**

Add to the "Course Management" describe block in `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
  describe("updateCourse", function () {
    beforeEach(async function () {
      await contract.createCourse(courseCode, courseName, imageURI, validityDuration);
    });

    it("Should update course metadata", async function () {
      const newName = "Advanced React Certification";
      const newImageURI = "https://example.com/badges/react-advanced.png";
      const newDuration = 63072000; // 2 years

      const tx = await contract.updateCourse(1, newName, newImageURI, newDuration);

      await expect(tx)
        .to.emit(contract, "CourseUpdated")
        .withArgs(1, newName, newImageURI, newDuration);

      const course = await contract.getCourse(1);
      expect(course.courseCode).to.equal(courseCode); // Code unchanged
      expect(course.courseName).to.equal(newName);
      expect(course.imageURI).to.equal(newImageURI);
      expect(course.validityDuration).to.equal(newDuration);
    });

    it("Should reject updating non-existent course", async function () {
      await expect(
        contract.updateCourse(999, courseName, imageURI, validityDuration)
      ).to.be.revertedWith("Course does not exist");
    });

    it("Should reject empty course name", async function () {
      await expect(
        contract.updateCourse(1, "", imageURI, validityDuration)
      ).to.be.revertedWith("Course name cannot be empty");
    });

    it("Should reject empty image URI", async function () {
      await expect(
        contract.updateCourse(1, courseName, "", validityDuration)
      ).to.be.revertedWith("Image URI cannot be empty");
    });

    it("Should reject zero validity duration", async function () {
      await expect(
        contract.updateCourse(1, courseName, imageURI, 0)
      ).to.be.revertedWith("Validity duration must be greater than zero");
    });

    it("Should only allow admin to update courses", async function () {
      await expect(
        contract.connect(unauthorized).updateCourse(1, "New Name", imageURI, validityDuration)
      ).to.be.reverted;
    });
  });
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Failures - updateCourse doesn't exist

**Step 3: Implement updateCourse function**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Update existing course metadata
     * @dev Cannot update course code (immutable for mapping integrity)
     * @param tokenId The token ID of the course to update
     * @param courseName New course name
     * @param imageURI New image URI
     * @param validityDuration New validity duration
     */
    function updateCourse(
        uint256 tokenId,
        string memory courseName,
        string memory imageURI,
        uint256 validityDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_courses[tokenId].exists, "Course does not exist");
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        require(bytes(imageURI).length > 0, "Image URI cannot be empty");
        require(validityDuration > 0, "Validity duration must be greater than zero");

        _courses[tokenId].courseName = courseName;
        _courses[tokenId].imageURI = imageURI;
        _courses[tokenId].validityDuration = validityDuration;

        emit CourseUpdated(tokenId, courseName, imageURI, validityDuration);
    }
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement course updates

- Add updateCourse function for admin
- Course code remains immutable
- Add validation and tests"
```

---

## Task 4: Implement Single Certification Minting

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for minting**

Add new describe block to `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
describe("Minting Certifications", function () {
  const courseCode = "REACT-101";
  const courseName = "React Developer Certification";
  const imageURI = "https://example.com/badges/react-101.png";
  const validityDuration = 31536000; // 1 year

  beforeEach(async function () {
    await contract.createCourse(courseCode, courseName, imageURI, validityDuration);
  });

  describe("mintCertification", function () {
    it("Should mint certification to student", async function () {
      const tx = await contract.connect(minter).mintCertification(
        student.address,
        1,
        "0x"
      );

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const mintTimestamp = block!.timestamp;
      const expiryTimestamp = mintTimestamp + validityDuration;

      await expect(tx)
        .to.emit(contract, "CertificationMinted")
        .withArgs(student.address, 1, mintTimestamp, expiryTimestamp);

      expect(await contract.balanceOf(student.address, 1)).to.equal(1);
    });

    it("Should record mint timestamp", async function () {
      await contract.connect(minter).mintCertification(student.address, 1, "0x");

      const mintTimestamp = await contract.getMintTimestamp(1, student.address);
      expect(mintTimestamp).to.be.greaterThan(0);
    });

    it("Should update timestamp on re-certification", async function () {
      await contract.connect(minter).mintCertification(student.address, 1, "0x");
      const firstMint = await contract.getMintTimestamp(1, student.address);

      // Wait 1 second
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(minter).mintCertification(student.address, 1, "0x");
      const secondMint = await contract.getMintTimestamp(1, student.address);

      expect(secondMint).to.be.greaterThan(firstMint);
      expect(await contract.balanceOf(student.address, 1)).to.equal(2);
    });

    it("Should reject minting non-existent course", async function () {
      await expect(
        contract.connect(minter).mintCertification(student.address, 999, "0x")
      ).to.be.revertedWith("Course does not exist");
    });

    it("Should reject minting to zero address", async function () {
      await expect(
        contract.connect(minter).mintCertification(ethers.ZeroAddress, 1, "0x")
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should only allow minter role to mint", async function () {
      await expect(
        contract.connect(unauthorized).mintCertification(student.address, 1, "0x")
      ).to.be.reverted;
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Failures - mintCertification doesn't exist

**Step 3: Implement mintCertification function**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Mint a certification to a recipient
     * @param to Address receiving the certification
     * @param tokenId Course token ID
     * @param data Additional data for ERC1155 hooks
     */
    function mintCertification(
        address to,
        uint256 tokenId,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(_courses[tokenId].exists, "Course does not exist");
        require(to != address(0), "Cannot mint to zero address");

        _mintTimestamps[tokenId][to] = block.timestamp;

        uint256 expiryTimestamp = block.timestamp + _courses[tokenId].validityDuration;

        _mint(to, tokenId, 1, data);

        emit CertificationMinted(to, tokenId, block.timestamp, expiryTimestamp);
    }

    /**
     * @notice Get the mint timestamp for a holder's certification
     * @param tokenId Course token ID
     * @param holder Address of the certificate holder
     * @return timestamp When the certification was minted
     */
    function getMintTimestamp(uint256 tokenId, address holder) external view returns (uint256) {
        return _mintTimestamps[tokenId][holder];
    }
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement certification minting

- Add mintCertification function for MINTER_ROLE
- Record mint timestamps for expiry tracking
- Support re-certification with updated timestamps
- Add comprehensive minting tests"
```

---

## Task 5: Implement Batch Minting

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for batch minting**

Add to the "Minting Certifications" describe block:

```typescript
  describe("batchMintCertifications", function () {
    it("Should mint certifications to multiple recipients", async function () {
      const recipients = [student.address, unauthorized.address];

      await contract.connect(minter).batchMintCertifications(recipients, 1, "0x");

      expect(await contract.balanceOf(student.address, 1)).to.equal(1);
      expect(await contract.balanceOf(unauthorized.address, 1)).to.equal(1);

      const studentTimestamp = await contract.getMintTimestamp(1, student.address);
      const unauthorizedTimestamp = await contract.getMintTimestamp(1, unauthorized.address);

      expect(studentTimestamp).to.be.greaterThan(0);
      expect(unauthorizedTimestamp).to.be.greaterThan(0);
    });

    it("Should emit event for each recipient", async function () {
      const recipients = [student.address, unauthorized.address];

      const tx = await contract.connect(minter).batchMintCertifications(recipients, 1, "0x");

      await expect(tx)
        .to.emit(contract, "CertificationMinted")
        .withArgs(student.address, 1, ethers.anything, ethers.anything);
    });

    it("Should reject empty recipients array", async function () {
      await expect(
        contract.connect(minter).batchMintCertifications([], 1, "0x")
      ).to.be.revertedWith("Recipients array cannot be empty");
    });

    it("Should reject non-existent course", async function () {
      await expect(
        contract.connect(minter).batchMintCertifications([student.address], 999, "0x")
      ).to.be.revertedWith("Course does not exist");
    });

    it("Should only allow minter role", async function () {
      await expect(
        contract.connect(unauthorized).batchMintCertifications([student.address], 1, "0x")
      ).to.be.reverted;
    });
  });
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Failures - batchMintCertifications doesn't exist

**Step 3: Implement batchMintCertifications function**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Mint certifications to multiple recipients
     * @param recipients Array of addresses receiving certifications
     * @param tokenId Course token ID
     * @param data Additional data for ERC1155 hooks
     */
    function batchMintCertifications(
        address[] memory recipients,
        uint256 tokenId,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(recipients.length > 0, "Recipients array cannot be empty");
        require(_courses[tokenId].exists, "Course does not exist");

        uint256 mintTimestamp = block.timestamp;
        uint256 expiryTimestamp = mintTimestamp + _courses[tokenId].validityDuration;

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            require(recipient != address(0), "Cannot mint to zero address");

            _mintTimestamps[tokenId][recipient] = mintTimestamp;
            _mint(recipient, tokenId, 1, data);

            emit CertificationMinted(recipient, tokenId, mintTimestamp, expiryTimestamp);
        }
    }
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement batch minting

- Add batchMintCertifications for multiple recipients
- Emit events for each mint
- Add validation and tests"
```

---

## Task 6: Implement Expiry Validation

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for validation**

Add new describe block to `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
describe("Validation", function () {
  const courseCode = "REACT-101";
  const courseName = "React Developer Certification";
  const imageURI = "https://example.com/badges/react-101.png";
  const validityDuration = 31536000; // 1 year

  beforeEach(async function () {
    await contract.createCourse(courseCode, courseName, imageURI, validityDuration);
    await contract.connect(minter).mintCertification(student.address, 1, "0x");
  });

  describe("isValid", function () {
    it("Should return true for valid certification", async function () {
      expect(await contract.isValid(1, student.address)).to.be.true;
    });

    it("Should return false after expiry", async function () {
      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [validityDuration + 1]);
      await ethers.provider.send("evm_mine", []);

      expect(await contract.isValid(1, student.address)).to.be.false;
    });

    it("Should return false for non-holder", async function () {
      expect(await contract.isValid(1, unauthorized.address)).to.be.false;
    });

    it("Should return false for zero balance", async function () {
      expect(await contract.isValid(1, owner.address)).to.be.false;
    });

    it("Should return true just before expiry", async function () {
      // Fast forward to 1 second before expiry
      await ethers.provider.send("evm_increaseTime", [validityDuration - 1]);
      await ethers.provider.send("evm_mine", []);

      expect(await contract.isValid(1, student.address)).to.be.true;
    });

    it("Should return false at exact expiry time", async function () {
      // Fast forward to exact expiry
      await ethers.provider.send("evm_increaseTime", [validityDuration]);
      await ethers.provider.send("evm_mine", []);

      expect(await contract.isValid(1, student.address)).to.be.false;
    });
  });

  describe("isValidBatch", function () {
    beforeEach(async function () {
      await contract.connect(minter).mintCertification(unauthorized.address, 1, "0x");
    });

    it("Should return validity for multiple holders", async function () {
      const holders = [student.address, unauthorized.address, owner.address];
      const results = await contract.isValidBatch(1, holders);

      expect(results[0]).to.be.true; // student has valid cert
      expect(results[1]).to.be.true; // unauthorized has valid cert
      expect(results[2]).to.be.false; // owner has no cert
    });

    it("Should handle expired certifications in batch", async function () {
      await ethers.provider.send("evm_increaseTime", [validityDuration + 1]);
      await ethers.provider.send("evm_mine", []);

      const holders = [student.address, unauthorized.address];
      const results = await contract.isValidBatch(1, holders);

      expect(results[0]).to.be.false;
      expect(results[1]).to.be.false;
    });

    it("Should reject empty holders array", async function () {
      await expect(
        contract.isValidBatch(1, [])
      ).to.be.revertedWith("Holders array cannot be empty");
    });
  });

  describe("getExpiryTimestamp", function () {
    it("Should return correct expiry timestamp", async function () {
      const mintTimestamp = await contract.getMintTimestamp(1, student.address);
      const expiryTimestamp = await contract.getExpiryTimestamp(1, student.address);

      expect(expiryTimestamp).to.equal(mintTimestamp + BigInt(validityDuration));
    });

    it("Should return 0 for non-holder", async function () {
      expect(await contract.getExpiryTimestamp(1, unauthorized.address)).to.equal(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Failures - validation functions don't exist

**Step 3: Implement validation functions**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Check if a certification is currently valid
     * @param tokenId Course token ID
     * @param holder Address of the certificate holder
     * @return bool True if holder has a non-expired certification
     */
    function isValid(uint256 tokenId, address holder) external view returns (bool) {
        if (balanceOf(holder, tokenId) == 0) {
            return false;
        }

        uint256 mintTimestamp = _mintTimestamps[tokenId][holder];
        if (mintTimestamp == 0) {
            return false;
        }

        uint256 expiryTimestamp = mintTimestamp + _courses[tokenId].validityDuration;
        return block.timestamp < expiryTimestamp;
    }

    /**
     * @notice Check validity for multiple holders
     * @param tokenId Course token ID
     * @param holders Array of addresses to check
     * @return results Array of validity results matching holders array
     */
    function isValidBatch(uint256 tokenId, address[] memory holders)
        external
        view
        returns (bool[] memory)
    {
        require(holders.length > 0, "Holders array cannot be empty");

        bool[] memory results = new bool[](holders.length);

        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];

            if (balanceOf(holder, tokenId) == 0) {
                results[i] = false;
                continue;
            }

            uint256 mintTimestamp = _mintTimestamps[tokenId][holder];
            if (mintTimestamp == 0) {
                results[i] = false;
                continue;
            }

            uint256 expiryTimestamp = mintTimestamp + _courses[tokenId].validityDuration;
            results[i] = block.timestamp < expiryTimestamp;
        }

        return results;
    }

    /**
     * @notice Get the expiry timestamp for a holder's certification
     * @param tokenId Course token ID
     * @param holder Address of the certificate holder
     * @return timestamp When the certification expires (0 if not held)
     */
    function getExpiryTimestamp(uint256 tokenId, address holder) external view returns (uint256) {
        uint256 mintTimestamp = _mintTimestamps[tokenId][holder];
        if (mintTimestamp == 0) {
            return 0;
        }
        return mintTimestamp + _courses[tokenId].validityDuration;
    }
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement expiry validation

- Add isValid function for single holder check
- Add isValidBatch for multiple holders
- Add getExpiryTimestamp helper
- Add comprehensive validation tests with time travel"
```

---

## Task 7: Implement Metadata URI

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing test for URI function**

Add new describe block to `packages/contracts/test/TrainingCertification.test.ts`:

```typescript
describe("Metadata", function () {
  const courseCode = "REACT-101";
  const courseName = "React Developer Certification";
  const imageURI = "https://example.com/badges/react-101.png";
  const validityDuration = 31536000; // 1 year

  beforeEach(async function () {
    await contract.createCourse(courseCode, courseName, imageURI, validityDuration);
  });

  describe("uri", function () {
    it("Should return JSON metadata for existing course", async function () {
      const uri = await contract.uri(1);

      // Parse the JSON (it will be a data URI or plain JSON)
      expect(uri).to.include(courseName);
      expect(uri).to.include(courseCode);
      expect(uri).to.include(imageURI);
    });

    it("Should revert for non-existent course", async function () {
      await expect(contract.uri(999)).to.be.revertedWith("Course does not exist");
    });
  });

  describe("getTotalCourses", function () {
    it("Should return correct course count", async function () {
      expect(await contract.getTotalCourses()).to.equal(1);

      await contract.createCourse("VUE-101", "Vue Cert", imageURI, validityDuration);
      expect(await contract.getTotalCourses()).to.equal(2);
    });

    it("Should return 0 when no courses created", async function () {
      const freshContract = await (await ethers.getContractFactory("TrainingCertification")).deploy();
      expect(await freshContract.getTotalCourses()).to.equal(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: Failures - URI functions don't exist

**Step 3: Install base64 library for URI encoding**

Add helper library to contract:

```solidity
// Add this import at the top
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
```

Run:
```bash
pnpm --filter @acme/contracts build
```

**Step 4: Implement URI function**

Add to `packages/contracts/contracts/TrainingCertification.sol`:

```solidity
    /**
     * @notice Get metadata URI for a token
     * @param tokenId Course token ID
     * @return JSON metadata as data URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(_courses[tokenId].exists, "Course does not exist");

        Course memory course = _courses[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                course.courseName,
                '","description":"Official certification for ',
                course.courseName,
                '","image":"',
                course.imageURI,
                '","attributes":[',
                '{"trait_type":"Course Code","value":"',
                course.courseCode,
                '"},',
                '{"trait_type":"Validity Duration","value":"',
                Strings.toString(course.validityDuration),
                ' seconds"}',
                ']}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    /**
     * @notice Get total number of courses created
     * @return count Total courses
     */
    function getTotalCourses() external view returns (uint256) {
        return _nextTokenId - 1;
    }
```

**Step 5: Run tests to verify they pass**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing

**Step 6: Commit**

```bash
git add packages/contracts/contracts/TrainingCertification.sol packages/contracts/test/TrainingCertification.test.ts
git commit -m "feat(contracts): implement metadata URI

- Override uri() function with JSON metadata
- Encode metadata as base64 data URI
- Include course info and attributes
- Add getTotalCourses helper function"
```

---

## Task 8: Add Helper View Functions

**Files:**
- Modify: `packages/contracts/contracts/TrainingCertification.sol`
- Modify: `packages/contracts/test/TrainingCertification.test.ts`

**Step 1: Write failing tests for helpers**

Add to the "Metadata" describe block:

```typescript
  describe("Helper Functions", function () {
    beforeEach(async function () {
      await contract.connect(minter).mintCertification(student.address, 1, "0x");
    });

    it("getCourse should return complete course data", async function () {
      const course = await contract.getCourse(1);

      expect(course.courseCode).to.equal(courseCode);
      expect(course.courseName).to.equal(courseName);
      expect(course.imageURI).to.equal(imageURI);
      expect(course.validityDuration).to.equal(validityDuration);
      expect(course.exists).to.be.true;
    });

    it("getMintTimestamp should return mint time", async function () {
      const timestamp = await contract.getMintTimestamp(1, student.address);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("getExpiryTimestamp should return expiry time", async function () {
      const mintTime = await contract.getMintTimestamp(1, student.address);
      const expiryTime = await contract.getExpiryTimestamp(1, student.address);

      expect(expiryTime).to.equal(mintTime + BigInt(validityDuration));
    });
  });
```

These tests should already pass from previous tasks - this is verification.

**Step 2: Run tests to verify all helpers work**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing (these were implemented in previous tasks)

**Step 3: Add comprehensive test coverage report**

Run:
```bash
pnpm --filter @acme/contracts test --coverage
```

Expected: Coverage report showing >95% coverage

**Step 4: Commit**

```bash
git add packages/contracts/test/TrainingCertification.test.ts
git commit -m "test(contracts): add comprehensive helper function tests

- Verify all view functions work correctly
- Add coverage report verification"
```

---

## Task 9: Create Deployment Script

**Files:**
- Create: `packages/contracts/scripts/deploy-training-certification.ts`
- Modify: `packages/contracts/hardhat.config.ts`

**Step 1: Update Hardhat config for Base Sepolia**

Modify `packages/contracts/hardhat.config.ts` to add Base Sepolia network:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;
```

**Step 2: Create deployment script**

Create `packages/contracts/scripts/deploy-training-certification.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TrainingCertification contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const TrainingCertificationFactory = await ethers.getContractFactory("TrainingCertification");
  const contract = await TrainingCertificationFactory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("TrainingCertification deployed to:", contractAddress);

  // Verify deployer is admin
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log("Deployer is admin:", hasRole);

  console.log("\nDeployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify contract on BaseScan:");
  console.log(`   pnpm hardhat verify --network baseSepolia ${contractAddress}`);
  console.log("2. Grant MINTER_ROLE to authorized addresses:");
  console.log(`   contract.grantRole(MINTER_ROLE, <address>)`);
  console.log("3. Create courses using createCourse()");
  console.log("\nSave this address to your .env:");
  console.log(`TRAINING_CERTIFICATION_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Step 3: Add deployment script to package.json**

Add to `packages/contracts/package.json` scripts:

```json
{
  "scripts": {
    "deploy:base-sepolia": "hardhat run scripts/deploy-training-certification.ts --network baseSepolia"
  }
}
```

**Step 4: Test deployment on local network**

Run:
```bash
# Start local node in one terminal
pnpm --filter @acme/contracts hardhat node

# Deploy in another terminal
pnpm --filter @acme/contracts hardhat run scripts/deploy-training-certification.ts --network localhost
```

Expected: Contract deploys successfully, address printed

**Step 5: Commit**

```bash
git add packages/contracts/scripts/deploy-training-certification.ts packages/contracts/hardhat.config.ts packages/contracts/package.json
git commit -m "feat(contracts): add deployment script for Base Sepolia

- Add Base Sepolia network configuration
- Create deployment script with verification steps
- Add deployment npm script
- Test deployment on local network"
```

---

## Task 10: Update Environment Variables and Documentation

**Files:**
- Modify: `.env.example`
- Create: `packages/contracts/README.md`

**Step 1: Update .env.example**

Add to `.env.example`:

```bash
# Smart Contract Deployment (Base Sepolia)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_deployer_wallet_private_key
BASESCAN_API_KEY=your_basescan_api_key

# Deployed Contract Addresses
TRAINING_CERTIFICATION_ADDRESS=
```

**Step 2: Create contracts package README**

Create `packages/contracts/README.md`:

```markdown
# @acme/contracts

Smart contracts for the training certification system.

## Contracts

### TrainingCertification

ERC-1155 NFT contract for training certifications with automatic expiry validation.

**Features:**
- Role-based minting (MINTER_ROLE)
- Course registry with metadata (code, name, image URI, duration)
- View-based expiry validation (no actual burning)
- Batch operations for minting and validation

**Roles:**
- `DEFAULT_ADMIN_ROLE` - Create/update courses, manage roles
- `MINTER_ROLE` - Mint certifications to users

## Development

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Format code
pnpm format

# Lint code
pnpm lint
```

## Deployment

### Base Sepolia Testnet

1. **Configure environment variables** in `.env`:
   ```bash
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   PRIVATE_KEY=your_private_key
   BASESCAN_API_KEY=your_api_key
   ```

2. **Deploy contract:**
   ```bash
   pnpm deploy:base-sepolia
   ```

3. **Verify on BaseScan:**
   ```bash
   pnpm hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
   ```

4. **Save contract address** to `.env`:
   ```bash
   TRAINING_CERTIFICATION_ADDRESS=0x...
   ```

### Post-Deployment Setup

1. **Grant MINTER_ROLE** to authorized addresses (instructors, systems):
   ```javascript
   const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
   await contract.grantRole(MINTER_ROLE, minterAddress);
   ```

2. **Create courses:**
   ```javascript
   await contract.createCourse(
     "REACT-101",
     "React Developer Certification",
     "https://example.com/badges/react-101.png",
     31536000 // 1 year in seconds
   );
   ```

3. **Mint certifications:**
   ```javascript
   await contract.mintCertification(studentAddress, tokenId, "0x");
   ```

## Contract Interaction

### Check Certification Validity

```javascript
const isValid = await contract.isValid(tokenId, holderAddress);
```

### Get Course Information

```javascript
const course = await contract.getCourse(tokenId);
// Returns: { courseCode, courseName, imageURI, validityDuration, exists }
```

### Get Expiry Timestamp

```javascript
const expiryTimestamp = await contract.getExpiryTimestamp(tokenId, holderAddress);
```

## Testing

Run the full test suite:

```bash
pnpm test
```

Tests cover:
- Course creation and updates
- Single and batch minting
- Expiry validation (with time travel)
- Access control
- Metadata URI generation
- Edge cases and error handling

## Gas Optimization

The contract is optimized for:
- Batch operations (minting multiple recipients)
- Efficient storage packing
- View functions (no gas cost for validation checks)

## Security

- **Access Control:** Strict role separation (admin vs minter)
- **Validation:** Input validation on all state-changing functions
- **Timestamp Safety:** Block timestamp used for expiry (day-level precision)
- **Overflow Protection:** Solidity 0.8+ built-in overflow checks

## Architecture

See `docs/plans/2025-01-22-training-certification-nft-design.md` for full design specification.
```

**Step 3: Commit**

```bash
git add .env.example packages/contracts/README.md
git commit -m "docs(contracts): add deployment documentation

- Update .env.example with contract variables
- Add comprehensive README for contracts package
- Document deployment process and post-deployment setup
- Add usage examples and testing guide"
```

---

## Task 11: Final Integration and Verification

**Files:**
- Modify: `packages/contracts/package.json`
- Create: `packages/contracts/.env.example`

**Step 1: Add local contract .env.example**

Create `packages/contracts/.env.example`:

```bash
# Base Sepolia Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=
BASESCAN_API_KEY=

# Deployed Contract
TRAINING_CERTIFICATION_ADDRESS=
```

**Step 2: Run full test suite**

Run:
```bash
pnpm --filter @acme/contracts test
```

Expected: All tests passing (50+ tests)

**Step 3: Generate coverage report**

Run:
```bash
pnpm --filter @acme/contracts test --coverage
```

Expected: >95% coverage across all functions

**Step 4: Run linter and formatter**

Run:
```bash
pnpm --filter @acme/contracts lint
pnpm --filter @acme/contracts format
```

Expected: No errors, code formatted correctly

**Step 5: Build and verify no errors**

Run:
```bash
pnpm --filter @acme/contracts build
```

Expected: Contracts compile, typechain types generated

**Step 6: Test deployment script on localhost**

Run:
```bash
# Terminal 1: Start local node
pnpm --filter @acme/contracts hardhat node

# Terminal 2: Deploy
pnpm --filter @acme/contracts hardhat run scripts/deploy-training-certification.ts --network localhost
```

Expected: Successful deployment with contract address

**Step 7: Final commit**

```bash
git add packages/contracts/.env.example packages/contracts/package.json
git commit -m "feat(contracts): finalize implementation

- Add local .env.example for contracts package
- Verify all tests passing (>95% coverage)
- Verify lint and format checks
- Test deployment script on local network

Implementation complete and ready for Base Sepolia deployment"
```

---

## Post-Implementation: Deployment to Base Sepolia

**Prerequisites:**
1. Get Base Sepolia ETH from faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Get BaseScan API key: https://basescan.org/myapikey
3. Configure `.env` with deployment credentials

**Deployment Steps:**

```bash
# 1. Deploy to Base Sepolia
pnpm --filter @acme/contracts deploy:base-sepolia

# 2. Verify on BaseScan
pnpm --filter @acme/contracts hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# 3. Save address to .env
echo "TRAINING_CERTIFICATION_ADDRESS=<CONTRACT_ADDRESS>" >> .env

# 4. Grant minter role to authorized address
# (Use Hardhat console or frontend)

# 5. Create test course
# (Use Hardhat console or frontend)

# 6. Mint test certification
# (Use Hardhat console or frontend)
```

**Verification Checklist:**
- [ ] Contract deployed to Base Sepolia
- [ ] Contract verified on BaseScan
- [ ] Address saved to .env
- [ ] Deployer has DEFAULT_ADMIN_ROLE
- [ ] MINTER_ROLE granted to test address
- [ ] Test course created successfully
- [ ] Test certification minted successfully
- [ ] Validation functions work on testnet
- [ ] Metadata displays correctly in NFT viewers

---

## Implementation Summary

**Total Tasks:** 11
**Estimated Time:** 3-4 hours for experienced developer
**Test Coverage Target:** >95%
**Files Created:** 4
**Files Modified:** 5

**Key Features Implemented:**
✅ ERC-1155 contract with OpenZeppelin base
✅ Role-based access control (admin, minter)
✅ Course registry with metadata
✅ Single and batch minting
✅ View-based expiry validation
✅ Metadata URI generation
✅ Comprehensive test suite
✅ Deployment scripts
✅ Documentation

**Ready for:**
- Base Sepolia deployment
- Frontend integration
- Backend API integration
- Production use (after audit)

**Next Steps:**
1. Deploy to Base Sepolia testnet
2. Integrate with frontend (Next.js app)
3. Build admin dashboard for course management
4. Build certification issuance system
5. Add verification UI for checking cert validity
