# Training Certification NFT Contract Design

**Date:** 2025-01-22
**Author:** Design Brainstorming Session
**Status:** Approved

## Overview

An ERC-1155 NFT contract representing training certifications with automatic expiry tracking. Each certification has a fixed validity period and expires after a set duration. Expired certifications remain in wallets but are marked as invalid through a view function.

**Deployment Target:** Base Sepolia testnet

## Requirements Summary

- **Token Standard:** ERC-1155 (multiple holders per certification type)
- **Expiry Mechanism:** View-based validation (no actual burning)
- **Access Control:** Role-based minting with OpenZeppelin AccessControl
- **Metadata:** On-chain storage of course code, name, and image URI
- **Expiry Duration:** Fixed per token ID, set during course creation
- **Renewal:** No renewal mechanism - users must get new certifications minted
- **Token IDs:** Auto-incrementing sequential IDs

## Section 1: Contract Architecture & Core Structure

### Contract Foundation

The certification NFT will inherit from:
- `ERC1155` - Core multi-token functionality
- `AccessControl` - Role-based permissions
- `ERC1155Supply` - Track token supplies and balances

Contract name: `TrainingCertification`

### Access Control Roles

Two roles managed via OpenZeppelin AccessControl:

1. **`DEFAULT_ADMIN_ROLE`** (contract owner)
   - Create and update courses
   - Grant/revoke MINTER_ROLE
   - Emergency functions

2. **`MINTER_ROLE`** (authorized issuers)
   - Mint certifications to users
   - Can be granted to multiple addresses (instructors, systems)

### Core Data Structures

**Course Struct:**
```solidity
struct Course {
    string courseCode;        // e.g., "REACT-101"
    string courseName;        // e.g., "React Developer Certification"
    string imageURI;          // HTTP/IPFS link to badge image
    uint256 validityDuration; // Seconds (e.g., 31536000 for 1 year)
    bool exists;              // Course is registered
}
```

**State Variables:**
```solidity
uint256 private _nextTokenId;                                    // Auto-increment counter, starts at 1
mapping(uint256 => Course) private _courses;                     // Token ID => Course metadata
mapping(uint256 => mapping(address => uint256)) private _mintTimestamps; // Token ID => Holder => Mint timestamp
mapping(bytes32 => uint256) private _courseCodeToTokenId;       // Course code hash => Token ID (prevent duplicates)
```

## Section 2: Course Creation & Token ID Management

### Creating New Courses

Only `DEFAULT_ADMIN_ROLE` can create courses:

```solidity
function createCourse(
    string memory courseCode,
    string memory courseName,
    string memory imageURI,
    uint256 validityDuration
) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256)
```

**Process:**
1. Validate inputs (non-empty strings, duration > 0)
2. Check course code uniqueness via `_courseCodeToTokenId` mapping
3. Assign current `_nextTokenId` to this course
4. Store course metadata in `_courses[tokenId]`
5. Store course code mapping for duplicate prevention
6. Increment `_nextTokenId`
7. Emit `CourseCreated(tokenId, courseCode, courseName)` event
8. Return the new token ID

**Validation Rules:**
- Course code: Non-empty, unique across all courses
- Course name: Non-empty string
- Image URI: Non-empty string (must be valid URI)
- Validity duration: Minimum 1 day (86400 seconds)

### Updating Courses

Admin can update existing course metadata:

```solidity
function updateCourse(
    uint256 tokenId,
    string memory courseName,
    string memory imageURI,
    uint256 validityDuration
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

**Important:** Updates affect future mints only. Already-minted certifications retain their original expiry dates and metadata.

**Cannot update:** Course code (immutable after creation to maintain mapping integrity)

## Section 3: Minting Process & Expiry Tracking

### Minting Certifications

Only `MINTER_ROLE` can mint certifications:

```solidity
function mintCertification(
    address to,
    uint256 tokenId,
    bytes memory data
) external onlyRole(MINTER_ROLE)
```

**Process:**
1. Validate course exists (`_courses[tokenId].exists == true`)
2. Validate recipient address (not zero address)
3. Record mint timestamp: `_mintTimestamps[tokenId][to] = block.timestamp`
4. Mint 1 token to recipient using `_mint(to, tokenId, 1, data)`
5. Emit `CertificationMinted(to, tokenId, block.timestamp, expiryTimestamp)` event

**Expiry Calculation:**
```solidity
expiryTimestamp = block.timestamp + _courses[tokenId].validityDuration
```

### Batch Minting

For issuing certifications to multiple students:

```solidity
function batchMintCertifications(
    address[] memory recipients,
    uint256 tokenId,
    bytes memory data
) external onlyRole(MINTER_ROLE)
```

Same validation as single mint, but loops through recipients array.

### Re-certification Handling

Users can receive the same certification multiple times (e.g., retaking a course). Each mint:
- **Updates** the mint timestamp to the most recent mint
- Increments the user's balance by 1
- Resets the expiry calculation based on the new mint time

**Example:** User gets "React-101" in Jan 2024 (expires Jan 2025), then retakes course and gets minted again in June 2024 (expires June 2025). The `_mintTimestamps` updates to June 2024.

## Section 4: Validation & Metadata

### Expiry Validation

Core validation function accessible by anyone:

```solidity
function isValid(uint256 tokenId, address holder) external view returns (bool)
```

**Logic:**
1. Check if holder has balance > 0 for this token ID
2. Retrieve mint timestamp from `_mintTimestamps[tokenId][holder]`
3. Calculate expiry: `mintTime + validityDuration`
4. Return `block.timestamp < expiryTimestamp`

Returns `false` if:
- User has zero balance
- Mint timestamp not found
- Current time >= expiry time

### Batch Validation

Check validity for multiple holders:

```solidity
function isValidBatch(
    uint256 tokenId,
    address[] memory holders
) external view returns (bool[] memory)
```

Returns array of boolean values matching the holders array.

### Metadata (ERC-1155 URI)

Override the `uri()` function to return JSON metadata:

```solidity
function uri(uint256 tokenId) public view override returns (string memory)
```

**Returns JSON structure:**
```json
{
  "name": "React Developer Certification",
  "description": "Official certification for React development skills",
  "image": "https://example.com/badges/react-101.png",
  "attributes": [
    {
      "trait_type": "Course Code",
      "value": "REACT-101"
    },
    {
      "trait_type": "Validity Duration",
      "value": "1 year"
    }
  ]
}
```

**Implementation:** Build JSON string dynamically from `_courses[tokenId]` data. Use Base64 encoding for data URI or return IPFS/HTTP URI.

### Helper View Functions

```solidity
// Get course information
function getCourse(uint256 tokenId) external view returns (Course memory)

// Get mint timestamp for a holder
function getMintTimestamp(uint256 tokenId, address holder) external view returns (uint256)

// Get expiry timestamp for a holder
function getExpiryTimestamp(uint256 tokenId, address holder) external view returns (uint256)

// Get all course token IDs
function getTotalCourses() external view returns (uint256)
```

## Section 5: Deployment & Testing Strategy

### Deployment Configuration

**Network:** Base Sepolia testnet

**Constructor Parameters:**
```solidity
constructor() ERC1155("") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _nextTokenId = 1; // Start token IDs at 1
}
```

**Post-Deployment Setup:**
1. Deploy contract
2. Grant `MINTER_ROLE` to authorized addresses
3. Create initial courses via `createCourse()`
4. Verify contract on Base Sepolia explorer

### Environment Variables

Required in `.env`:
```bash
# Deployment
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_deployer_private_key

# Contract addresses (after deployment)
TRAINING_CERTIFICATION_ADDRESS=0x...
```

### Testing Strategy

**Unit Tests (Hardhat):**

1. **Course Management Tests**
   - Create course with valid parameters
   - Reject invalid course parameters (empty strings, zero duration)
   - Prevent duplicate course codes
   - Update existing course metadata
   - Only admin can create/update courses

2. **Minting Tests**
   - Mint certification to user
   - Record correct mint timestamp
   - Batch mint to multiple users
   - Only MINTER_ROLE can mint
   - Reject minting non-existent courses
   - Handle re-certification (update timestamp)

3. **Validation Tests**
   - Valid certification returns true
   - Expired certification returns false
   - Non-holder returns false
   - Time-travel tests for expiry logic
   - Batch validation accuracy

4. **Access Control Tests**
   - Role assignment and revocation
   - Permission boundaries (minter can't create courses, etc.)
   - Admin can grant/revoke roles

5. **Metadata Tests**
   - URI returns correct JSON structure
   - Dynamic data insertion
   - Course info retrieval

**Test Coverage Goal:** >95% line coverage

### Integration Testing

Test with frontend/backend systems:
- Wallet integration (MetaMask on Base Sepolia)
- Metadata display in NFT viewers
- API calls to `isValid()` function
- Event monitoring for minting/expiry tracking

### Gas Optimization Considerations

- Use `calldata` instead of `memory` for external function string parameters
- Pack structs efficiently (already optimized)
- Batch operations for multiple mints
- Consider using OpenZeppelin's `ERC1155URIStorage` if per-token URIs needed

## Technical Dependencies

**OpenZeppelin Contracts v5.x:**
- `@openzeppelin/contracts/token/ERC1155/ERC1155.sol`
- `@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol`
- `@openzeppelin/contracts/access/AccessControl.sol`

**Development Tools:**
- Hardhat for compilation and testing
- Hardhat-deploy for deployment management
- ethers.js v6 for contract interaction
- Hardhat-gas-reporter for optimization
- Solidity-coverage for test coverage

## Security Considerations

1. **Access Control:** Strict role separation between admin and minters
2. **Timestamp Dependence:** Expiry relies on `block.timestamp` (acceptable for day-level precision)
3. **Reentrancy:** Not applicable (no external calls during state changes)
4. **Integer Overflow:** Solidity 0.8+ has built-in overflow protection
5. **Course Code Uniqueness:** Enforced via mapping to prevent conflicts

## Future Enhancements (Out of Scope)

- On-chain credential verification registry
- Integration with learning management systems (LMS)
- Multi-signature admin operations
- Royalty enforcement for certification transfers (if transferable)
- Achievement badges and skill trees
- Oracle integration for automated compliance checks

## Implementation Checklist

- [ ] Set up Hardhat project in `packages/contracts`
- [ ] Install OpenZeppelin contracts
- [ ] Write `TrainingCertification.sol` contract
- [ ] Implement course creation and management functions
- [ ] Implement minting functions (single and batch)
- [ ] Implement validation functions (`isValid`, `isValidBatch`)
- [ ] Implement metadata URI generation
- [ ] Write comprehensive unit tests (>95% coverage)
- [ ] Write deployment script for Base Sepolia
- [ ] Configure environment variables
- [ ] Deploy to Base Sepolia testnet
- [ ] Verify contract on BaseScan
- [ ] Test minting and validation on testnet
- [ ] Document contract addresses and ABI locations

## Success Criteria

✅ Contract deploys successfully to Base Sepolia
✅ Admins can create courses with metadata
✅ Minters can issue certifications to users
✅ `isValid()` correctly identifies expired certifications
✅ Metadata displays correctly in NFT viewers
✅ All tests pass with >95% coverage
✅ Gas costs are reasonable for intended use
✅ Contract verified on BaseScan explorer
