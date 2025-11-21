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
  });

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
          .to.emit(contract, "CertificationMinted");
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
  });

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

        // Should return a data URI with base64 encoding
        expect(uri).to.include("data:application/json;base64,");

        // Decode and verify the JSON contents
        const base64Data = uri.replace("data:application/json;base64,", "");
        const jsonString = Buffer.from(base64Data, "base64").toString("utf-8");
        const metadata = JSON.parse(jsonString);

        expect(metadata.name).to.equal(courseName);
        expect(metadata.image).to.equal(imageURI);
        expect(metadata.attributes).to.have.lengthOf(2);
        expect(metadata.attributes[0].value).to.equal(courseCode);
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
  });
});
