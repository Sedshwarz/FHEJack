import "dotenv/config";
import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { createDeck, calculateHand } from "./gameLogic.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://fhejack.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(cors());
app.use(express.json());

// Oracle Wallet
const signer = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY);
console.log("🃏 Oracle Address:", signer.address);

const games = {}; 

// START GAME
app.post("/start", (req, res) => {
    try {

        const { playerAddress, betAmount, gameId, seed } = req.body;

        if (!playerAddress || !betAmount || !gameId) {
            throw new Error("Missing data: playerAddress, betAmount, or gameId is missing.");
        }

        if (games[gameId]) {
            return res.status(400).json({ error: "The game has already begun." });
        }

        const deck = createDeck(seed);

        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        games[gameId] = {
            id: gameId,
            player: playerAddress,
            bet: betAmount,
            deck: deck,
            playerHand,
            dealerHand,
            status: "ACTIVE"
        };

        const playerScore = calculateHand(playerHand);
        
        if (playerScore === 21) {
            const dealerScore = calculateHand(dealerHand);
            if (dealerScore === 21) games[gameId].status = "PUSH";
            else games[gameId].status = "PLAYER_WON_BJ";
            
            return finishGame(res, gameId);
        }

        res.json({
            gameId,
            playerHand,
            dealerVisibleCard: dealerHand[0], 
            playerScore,
            dealerScore: calculateHand([dealerHand[0]]),
            status: "ACTIVE"
        });

    } catch (error) {
        console.error("❌ /start ERROR:", error);
        res.status(500).json({ error: error.message || "Server Error" });
    }
});

// HIT
app.post("/hit", (req, res) => {
    const { gameId } = req.body;
    const game = games[gameId];

    if (!game || game.status !== "ACTIVE") return res.status(400).json({ error: "Invalid game" });

    const card = game.deck.pop();
    game.playerHand.push(card);

    const score = calculateHand(game.playerHand);
    if (score > 21) {
        game.status = "PLAYER_BUST";
        return finishGame(res, gameId);
    }

    res.json({
        playerHand: game.playerHand,
        playerScore: score,
        dealerVisibleCard: game.dealerHand[0],
        card,
        status: "ACTIVE"
    });
});

// STAND
app.post("/stand", (req, res) => {
    const { gameId } = req.body;
    const game = games[gameId];

    if (!game || game.status !== "ACTIVE") return res.status(400).json({ error: "Invalid game" });

    const playerScore = calculateHand(game.playerHand);
    let dealerScore = calculateHand(game.dealerHand);
    
    while (dealerScore < 17 || (dealerScore < playerScore && dealerScore < 21)) {
        game.dealerHand.push(game.deck.pop());
        dealerScore = calculateHand(game.dealerHand);
    }

    if (dealerScore > 21) game.status = "DEALER_BUST";
    else if (dealerScore > playerScore) game.status = "DEALER_WON";
    else if (dealerScore < playerScore) game.status = "PLAYER_WON";
    else game.status = "PUSH";

    return finishGame(res, gameId);
});


// FINISH & SIGN
const finishGame = async (res, gameId) => {
    const game = games[gameId];
    let payout = 0;

    if (game.status === "PLAYER_WON" || game.status === "DEALER_BUST") {
        payout = game.bet * 2;
    } else if (game.status === "PLAYER_WON_BJ") {
        payout = Math.floor(game.bet * 2.5);
    } else if (game.status === "PUSH") {
        payout = game.bet;
    }

    let signature = null;
    if (payout > 0) {
        const messageHash = ethers.solidityPackedKeccak256(
            ["uint256", "address", "uint256"],
            [game.id, game.player, payout]
        );
        signature = await signer.signMessage(ethers.getBytes(messageHash));
    }

    res.json({
        status: game.status,
        dealerHand: game.dealerHand,
        playerHand: game.playerHand,
        dealerScore: calculateHand(game.dealerHand),
        playerScore: calculateHand(game.playerHand),
        payout,
        signature
    });
};

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));