import { createContext, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import * as CONTRACT_ABI from "../abi/FHEJack.json";
import { CONTRACT_ADDRESS, ORACLE_API_URL } from "../config.js";

import cardSfx from "../assets/sounds/card-place.mp3";
import shuffleSfx from "../assets/sounds/shuffle.mp3";
import coinSfx from "../assets/sounds/coins.mp3";
import winSfx from "../assets/sounds/win.mp3";
import loseSfx from "../assets/sounds/lose.mp3";
import pushSfx from "../assets/sounds/push.mp3";
import chipSfx from "../assets/sounds/chip-select.mp3";
import bgmMusic from "../assets/sounds/bgm.mp3";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [fhevmInstance, setFhevmInstance] = useState(null);
    const [contract, setContract] = useState(null);
    const [balance, setBalance] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState(0);
    const [firstGamePlayed, setFirstGamePlayed] = useState(false);

    const [gameState, setGameState] = useState({
        gameId: null, playerHand: [], dealerHand: [],
        playerScore: 0, dealerScore: 0, status: "IDLE",
        bet: 0, signature: null, payout: 0
    });

    const [loading, setLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);

    const [message, setMessage] = useState(null);

    const messageTimer = useRef(null);

    const throwMessage = (msg) => {
        if (messageTimer.current) {
            clearTimeout(messageTimer.current);
        }
        setMessage(msg);

        messageTimer.current = setTimeout(() => {
            setMessage(null);
            messageTimer.current = null;
        }, 3000);
    };


    useEffect(() => {
        initSDK().catch(console.error);
    }, []);


    const updateBalance = async (userAddr, contractObj) => {
        if (!userAddr || !contractObj) return;
        try {
            const bal = await contractObj.balances(userAddr);
            setBalance(Number(bal));

            const lastClaim = await contractObj.lastClaimTime(userAddr);
            const nextTime = Number(lastClaim) + (24 * 60 * 60);
            if (Date.now() / 1000 < nextTime) setNextClaimTime(nextTime * 1000);
            else setNextClaimTime(0);
        } catch (e) { console.error("Balance Error:", e); }
    };


    const connectWallet = async () => {
        if (!window.ethereum) return throwMessage("Metamask not found!");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (network.chainId.toString() !== "11155111") {
                throwMessage("Please switch to Sepolia Network");
                return;
            }

            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            const config = { ...SepoliaConfig, network: window.ethereum };
            const instance = await createInstance(config);
            const deployedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.default.abi, signer);

            setAccount(accounts[0]);
            setFhevmInstance(instance);
            setContract(deployedContract);

            updateBalance(accounts[0], deployedContract);
        } catch (error) { console.error("Connect Error:", error); }
    };


    const disconnectWallet = () => {
        setAccount(null);
        setBalance(0);
        setNextClaimTime(0);
        setFhevmInstance(null);
        setContract(null);

        setGameState({
            gameId: null, playerHand: [], dealerHand: [],
            playerScore: 0, dealerScore: 0, status: "IDLE",
            bet: 0, signature: null, payout: 0
        });
    };


    const claimFaucet = async () => {
        if (!contract) return;
        try {
            setTxLoading(true);
            const tx = await contract.faucet();
            await tx.wait();
            updateBalance(account, contract);
            playSound('coin');
            throwMessage("500 Chips Received! 💰");
        } catch (e) { throwMessage(e.message); }
        finally { setTxLoading(false); }
    };

    // --- START GAME (FIXED SEED LOGIC) ---
    const deal = async (betAmount) => {
        if (!contract || !fhevmInstance) return;
        try {
            if (betAmount > balance) return throwMessage("Insufficient Balance");
            setTxLoading(true);

            const newGameId = Date.now();
            //console.log("1. Starting Game on Blockchain...");

            const tx = await contract.startGame(newGameId, betAmount);
            const receipt = await tx.wait();

            const log = receipt.logs.find(log => {
                try { return contract.interface.parseLog(log)?.name === "GameStarted"; }
                catch { return false; }
            });
            const parsedLog = contract.interface.parseLog(log);
            const encryptedSeed = parsedLog.args.seed;

            //console.log("2. Decrypting Seed...");
            const decryptResult = await fhevmInstance.publicDecrypt([encryptedSeed]);

            let seedValue = "0";
            if (typeof decryptResult === 'bigint') {
                seedValue = decryptResult.toString();
            } else if (typeof decryptResult === 'number') {
                seedValue = decryptResult.toString();
            } else if (Array.isArray(decryptResult)) {
                seedValue = decryptResult[0].toString();
            } else if (typeof decryptResult === 'object' && decryptResult !== null) {
                const values = Object.values(decryptResult);
                if (values.length > 0) seedValue = values[0].toString();
            }

            //console.log("3. Calling Oracle with Seed:", seedValue);

            const response = await fetch(`${ORACLE_API_URL}/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerAddress: account,
                    betAmount: betAmount,
                    gameId: newGameId,
                    seed: seedValue
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            updateGameState({ 
                ...data, 
                status: "ACTIVE"
            });

            updateBalance(account, contract);
            setGameState(prev => ({ ...prev, gameId: newGameId, bet: betAmount }));

            if (data.status !== "ACTIVE") {
                await sleep(1500); 
                endGameSFX(data.status);
                updateGameState(data);
            }

        } catch (err) {
            console.error("Deal Error:", err);
            throwMessage("Deal Failed: " + err.message);
        } finally {
            setTxLoading(false);
            setFirstGamePlayed(true);
            playSound('start');
        }
    };


    const hit = async () => {
        if (loading || gameState.status !== "ACTIVE") return;

        try {
            setLoading(true);

            const res = await fetch(`${ORACLE_API_URL}/hit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: gameState.gameId })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setGameState(prev => ({
                ...prev,
                playerHand: data.playerHand,
                playerScore: data.playerScore,
                status: "ACTIVE"
            }));

            playSound('card');
            await sleep(1200);

            if (data.status !== "ACTIVE") {
                if (data.dealerHand && data.dealerHand.length >= 2) {
                    setGameState(prev => ({
                        ...prev,
                        dealerHand: data.dealerHand,
                        status: "ACTIVE"
                    }));

                    playSound('card');
                    await sleep(1200);
                }

                setGameState(prev => ({
                    ...prev,
                    status: "FINISHED",
                    payout: data.payout,
                    signature: data.signature,
                    dealerHand: data.dealerHand,
                    dealerScore: data.dealerScore
                }));

                endGameSFX(data.status);
            }

        } catch (e) {
            console.error("Hit Error:", e);
        } finally {
            setLoading(false);
        }
    };


    const stand = async () => {
        if (loading || gameState.status !== "ACTIVE") return;

        try {
            setLoading(true);

            const res = await fetch(`${ORACLE_API_URL}/stand`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: gameState.gameId })
            });
            const finalData = await res.json();
            if (finalData.error) throw new Error(finalData.error);

            const finalDealerHand = finalData.dealerHand;

            if (finalDealerHand.length >= 2) {
                const firstTwoCards = [finalDealerHand[0], finalDealerHand[1]];

                setGameState(prev => ({
                    ...prev,
                    dealerHand: firstTwoCards
                }));
                playSound('card');
                await sleep(1200);
            }
            for (let i = 2; i < finalDealerHand.length; i++) {
                const nextCard = finalDealerHand[i];
                setGameState(prev => ({
                    ...prev,
                    dealerHand: [...prev.dealerHand, nextCard],
                    dealerScore: "?",
                }));
                playSound('card');
                await sleep(1200);
            }
            setGameState(prev => ({
                ...prev,
                dealerHand: finalDealerHand,
                dealerScore: finalData.dealerScore,
                playerScore: finalData.playerScore,
                status: finalData.status === "ACTIVE" ? "ACTIVE" : "FINISHED",
                payout: finalData.payout,
                signature: finalData.signature
            }));

            if (finalData.status !== "ACTIVE") {
                endGameSFX(finalData.status);
            }

        } catch (e) {
            console.error("Stand Error:", e);
            throwMessage("Error: " + e.message);
        } finally {
            setLoading(false);
            endGameSFX();
        }
    };


    const claimWinnings = async (gid, amount, sig) => {
        try {
            setTxLoading(true);
            const tx = await contract.claimWinnings(gid, amount, sig);
            await tx.wait();

            updateBalance(account, contract);
            //alert("You Won! Chips Added.");

            setGameState({
                gameId: null,
                playerHand: [],
                dealerHand: [],
                playerScore: 0,
                dealerScore: 0,
                status: "IDLE",
                bet: 0,
                signature: null,
                payout: 0
            });

        } catch (e) {
            console.error(e);
            throwMessage("Claim Error: " + (e.reason || e.message));
        }
        finally {
            setTxLoading(false);
            setFirstGamePlayed(false);
            playSound('coin');
        }
    };



    // --- SAFE STATE UPDATE ---
    const updateGameState = (data) => {
        if (!data || data.error) return;

        setGameState(prev => {
            let newDealerHand = prev.dealerHand;

            if (data.dealerHand && data.dealerHand.length > 0) {
                newDealerHand = data.dealerHand;
            }
            else if (data.dealerVisibleCard !== undefined) {
                newDealerHand = [data.dealerVisibleCard];
            }
            return {
                ...prev,
                gameId: data.gameId || prev.gameId,
                playerHand: data.playerHand || prev.playerHand,
                dealerHand: newDealerHand,
                playerScore: data.playerScore !== undefined ? data.playerScore : prev.playerScore,
                dealerScore: data.dealerScore !== undefined ? data.dealerScore : prev.dealerScore,
                status: data.status === "ACTIVE" ? "ACTIVE" : "FINISHED",
                payout: data.payout !== undefined ? data.payout : prev.payout,
                signature: data.signature || prev.signature,
                bet: prev.bet
            };
        });
    };


    const endGameSFX = (resultStatus) => {
        if (resultStatus === "PLAYER_WON" || resultStatus === "PLAYER_WON_BJ") {
            playSound('win');
        } else if (resultStatus === "DEALER_WON" || resultStatus === "DEALER_BUST" || resultStatus === "PLAYER_BUST") {
            if (resultStatus === "DEALER_BUST") playSound('win');
            else playSound('lose');
        } else if (resultStatus === "PUSH") {
            playSound('push');
        }
    }


    // SFX
    const [sfxOn, setSfxOn] = useState(true);
    const [musicOn, setMusicOn] = useState(false);

    const bgmRef = useRef(new Audio(bgmMusic));

    useEffect(() => {
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3;

        if (musicOn) {
            bgmRef.current.play().catch(e => throwMessage("Music could not be started (User interaction required):", e));
        } else {
            bgmRef.current.pause();
        }
    }, [musicOn]);

    const playSound = (type) => {
        if (!sfxOn) return;

        let soundFile;
        let volume = 1.0;

        switch (type) {
            case 'card': soundFile = cardSfx; volume = 0.6; break;
            case 'start': soundFile = shuffleSfx; break;
            case 'coin': soundFile = coinSfx; break;
            case 'win': soundFile = winSfx; break;
            case 'lose': soundFile = loseSfx; break;
            case 'push': soundFile = pushSfx; break;
            case 'chip': soundFile = chipSfx; volume = 0.3; break;
            default: return;
        }

        const audio = new Audio(soundFile);
        audio.volume = volume;
        audio.play().catch(e => throwMessage("Sound error:", e));
    };

    return (
        <GameContext.Provider value={{
            account, connectWallet, balance, claimFaucet, nextClaimTime,
            gameState, deal, hit, stand, claimWinnings,
            loading, txLoading, disconnectWallet, firstGamePlayed, message, throwMessage,
            sfxOn, setSfxOn, musicOn, setMusicOn, playSound
        }}>
            {children}
        </GameContext.Provider>
    );
};