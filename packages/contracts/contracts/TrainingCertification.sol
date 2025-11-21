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

    /**
     * @notice Get course information by token ID
     * @param tokenId The token ID of the course
     * @return course The course data
     */
    function getCourse(uint256 tokenId) external view returns (Course memory) {
        require(_courses[tokenId].exists, "Course does not exist");
        return _courses[tokenId];
    }
}
