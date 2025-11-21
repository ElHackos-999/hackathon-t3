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
  });
});
