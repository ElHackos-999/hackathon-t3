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
pnpm coverage

# Format code
pnpm format

# Lint code
pnpm lint
```

## Deployment

### Base Sepolia Testnet

1. **Configure environment variables** in `.env`:
   ```bash
   PRIVATE_KEY=your_private_key
   ALCHEMY_API_KEY=your_alchemy_api_key
   BASESCAN_API_KEY=your_basescan_api_key
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

Coverage: >95% across all functions

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
