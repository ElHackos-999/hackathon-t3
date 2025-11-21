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

    /**
     * @notice Get the mint timestamp for a holder's certification
     * @param tokenId Course token ID
     * @param holder Address of the certificate holder
     * @return timestamp When the certification was minted
     */
    function getMintTimestamp(uint256 tokenId, address holder) external view returns (uint256) {
        return _mintTimestamps[tokenId][holder];
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
