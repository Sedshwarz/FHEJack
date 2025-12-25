// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FHEJack is ZamaEthereumConfig, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public owner;
    address public oracle; // Node.js Server Address

    // Chip Balances (Public for Oracle verification)
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastClaimTime;
    
    // Game State
    mapping(uint256 => bool) public gameClaimed;
    
    uint256 public constant FAUCET_AMOUNT = 500; 

    event GameStarted(address indexed player, uint256 indexed gameId, uint256 betAmount, euint64 seed);
    event GameClaimed(address indexed player, uint256 indexed gameId, uint256 amount);
    event FaucetUsed(address indexed player, uint256 amount);

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
    }

    // --- 1. FAUCET ---
    function faucet() external {
        require(block.timestamp >= lastClaimTime[msg.sender] + 1 days, "Wait 24h for faucet");
        
        balances[msg.sender] += FAUCET_AMOUNT;
        lastClaimTime[msg.sender] = block.timestamp;
        
        emit FaucetUsed(msg.sender, FAUCET_AMOUNT);
    }

    // --- 2. START GAME (Locks Bet, Generates FHE Seed) ---
    function startGame(uint256 gameId, uint256 betAmount) external {
        require(betAmount > 0, "Bet cannot be 0");
        require(balances[msg.sender] >= betAmount, "Insufficient chips");
        require(!gameClaimed[gameId], "Game ID already used");

        // Deduct balance
        balances[msg.sender] -= betAmount;

        // Generate Secure Random Seed via FHE
        euint64 seed = FHE.randEuint64();
        
        // Reveal seed so Oracle can read it to shuffle the deck
        FHE.makePubliclyDecryptable(seed);

        emit GameStarted(msg.sender, gameId, betAmount, seed);
    }

    // --- 3. CLAIM WINNINGS (Verifies Oracle Signature) ---
    function claimWinnings(
        uint256 gameId, 
        uint256 amount, 
        bytes calldata signature
    ) external nonReentrant {
        require(!gameClaimed[gameId], "Game already claimed");
        
        // Verify Signature: keccak256(gameId, player, amount)
        bytes32 messageHash = keccak256(abi.encodePacked(gameId, msg.sender, amount));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == oracle, "Invalid Oracle signature");

        gameClaimed[gameId] = true;

        // Add winnings to balance
        if (amount > 0) {
            balances[msg.sender] += amount;
        }

        emit GameClaimed(msg.sender, gameId, amount);
    }

    // --- ADMIN ---
    function setOracle(address _newOracle) external {
        require(msg.sender == owner, "Unauthorized");
        oracle = _newOracle;
    }
}