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
