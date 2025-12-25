import { useContext, useState, useEffect, useRef } from "react";
import { GameContext } from "../context/GameContext.js";
import wd from "../assets/wood.png";
import curved from "../assets/curved.png";
import won from "../assets/won.png";
import gameover from "../assets/gameover.png";
import push from "../assets/push.png";
import dChips from "../assets/dealer-chips.png";
import deck from "../assets/deck.png";
import fhejack from "../assets/fhejack.png";
import fhejack2 from "../assets/fhejack2.png";
import backCard from "../assets/back.png";
import { motion, AnimatePresence } from "framer-motion";




const getScaledPos = (element) => {
  const stage = document.querySelector('.game-stage');

  if (!stage || !element) return { x: 0, y: 0 };

  const stageRect = stage.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();
  const currentScale = stageRect.width / 1920;

  return {
    x: (elRect.left - stageRect.left) / currentScale,
    y: (elRect.top - stageRect.top) / currentScale
  };
};


const PokerChipIcon = ({ color, size = "140px" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512.003 512.003"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.5))' }}
  >
    <g>
      <path style={{ fill: color, transition: 'fill 0.3s ease' }} d="M512.001,256c0-141.383-114.617-256-256-256s-256,114.617-256,256s114.617,256,256,256
		S512.001,397.383,512.001,256"/>
      <g>
        <path style={{ fill: '#F3FBFF' }} d="M256.001,79.448C158.651,79.448,79.45,158.649,79.45,256s79.201,176.552,176.552,176.552
			S432.553,353.351,432.553,256S353.352,79.448,256.001,79.448 M256.001,450.207c-107.087,0-194.207-87.119-194.207-194.207
			S148.914,61.793,256.001,61.793S450.208,148.913,450.208,256S363.089,450.207,256.001,450.207"/>
        <path style={{ fill: '#F3FBFF' }} d="M2.484,291.31h71.601c-2.216-11.441-3.46-23.225-3.46-35.31s1.245-23.87,3.46-35.31H2.484
			C0.886,232.236,0.003,244.012,0.003,256S0.886,279.764,2.484,291.31"/>
        <path style={{ fill: '#F3FBFF' }} d="M53.698,99.219l50.591,50.591c13.639-19.43,30.87-36.105,50.776-49.09l-50.847-50.847
			C85.186,63.908,68.193,80.539,53.698,99.219"/>
        <path style={{ fill: '#F3FBFF' }} d="M256.001,0c-11.988,0-23.764,0.892-35.31,2.481V74.09c11.441-2.225,23.225-3.469,35.31-3.469
			c12.085,0,23.87,1.245,35.31,3.469V2.481C279.765,0.892,267.989,0,256.001,0"/>
        <path style={{ fill: '#F3FBFF' }} d="M409.287,50.95l-50.741,50.741c19.756,13.18,36.837,30.031,50.282,49.593l50.617-50.617
			C445.083,81.882,428.213,65.118,409.287,50.95"/>
        <path style={{ fill: '#F3FBFF' }} d="M441.381,256c0,12.085-1.245,23.87-3.469,35.31h71.609c1.589-11.546,2.481-23.322,2.481-35.31
			s-0.892-23.764-2.481-35.31h-71.609C440.136,232.13,441.381,243.915,441.381,256"/>
        <path style={{ fill: '#F3FBFF' }} d="M411.284,356.933c-12.985,19.906-29.661,37.146-49.09,50.785l50.591,50.582
			c18.67-14.495,35.302-31.479,49.346-50.52L411.284,356.933z"/>
        <path style={{ fill: '#F3FBFF' }} d="M220.691,437.913v71.601c11.546,1.598,23.322,2.489,35.31,2.489c11.988,0,23.764-0.892,35.31-2.489
			v-71.601c-11.441,2.216-23.225,3.469-35.31,3.469C243.916,441.382,232.132,440.128,220.691,437.913"/>
        <path style={{ fill: '#F3FBFF' }} d="M101.696,358.541l-50.741,50.741c14.168,18.935,30.932,35.796,49.717,50.158l50.617-50.617
			C131.727,395.379,114.867,378.297,101.696,358.541"/>
      </g>
    </g>
  </svg>
);



const SettingsMenu = () => {
  const { sfxOn, setSfxOn, musicOn, setMusicOn, playSound } = useContext(GameContext);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen && sfxOn) playSound('chip');
  };

  return (
    <div className="settings-container" ref={menuRef}>
      {/*(Toggle) */}
      <div className={`settings-icon ${isOpen ? 'active-si' : ''}`} onClick={toggleMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5" /></svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="settings-dropdown">
          <div className="setting-item" onClick={() => setMusicOn(!musicOn)}>
            <span>Music</span>
            <span className="toggle-status">{musicOn ? "ON 🔊" : "OFF 🔇"}</span>
          </div>
          <div className="setting-item" onClick={() => setSfxOn(!sfxOn)}>
            <span>SFX</span>
            <span className="toggle-status">{sfxOn ? "ON 🔔" : "OFF 🔕"}</span>
          </div>
        </div>
      )}
    </div>
  );
};




// --- HELPERS ---
const getCardData = (cardId) => {
  const suits = ["♠️", "♥️", "♣️", "♦️"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const colors = ["black", "red", "black", "red"];
  const suitIndex = Math.floor(cardId / 13);
  const rankIndex = cardId % 13;
  return { suit: suits[suitIndex], rank: ranks[rankIndex], color: colors[suitIndex], id: cardId };
};


const FlyingCard = ({ startPos, endPos, onComplete }) => {

  const [style, setStyle] = useState({
    position: "absolute",
    top: startPos.y,
    left: startPos.x,
    width: "110px",
    height: "160px",
    zIndex: 9999,
    transition: "all 1s cubic-bezier(0.25, 1, 0.5, 1)",
    pointerEvents: "none",
    backgroundImage: `url(${backCard})`,
    backgroundSize: "cover",
    borderRadius: "8px",
    transform: "scale(1) rotate(90deg)"
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      setStyle(prev => ({
        ...prev,
        top: endPos.y,
        left: endPos.x,
        transform: "scale(1) rotate(0deg)"
      }));
    });

    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div style={style} />;
};



const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatChipDisplay = (amount) => {
  const num = Number(amount);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};


const getChipColor = (amount) => {
  if (amount >= 1000) return "#c7b304";
  if (amount >= 500) return "#04c74f";
  if (amount >= 200) return "#2c3e50";
  if (amount >= 100) return "#e74c3c";
  if (amount >= 50) return "#3498db";
  return "#D1566D";
};



const Card = ({ id, hidden, cardRef, isInvisible, isRevealing, justArrived, isWaiting }) => {
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    if (isRevealing || justArrived) {
      setAnimClass("card-flip");
      const timer = setTimeout(() => {
        setAnimClass("");
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isRevealing, justArrived]);

  if (hidden) return <div className="card hidden-card"></div>;
  if (id === undefined || id === null) return null;

  const { suit, rank, color } = getCardData(id);
  const shouldBeHidden = isInvisible || isWaiting;

  return (
    <div
      ref={cardRef}
      className={`card ${animClass}`}
      style={{
        color,
        opacity: shouldBeHidden ? 0 : 1,
        transition: shouldBeHidden ? "none" : "all 0.3s",
      }}
    >
      <div className="card-top">{rank}</div>
      <div className="card-suit">{suit}</div>
      <div className="card-bottom">{rank}</div>
    </div>
  );
};



// --- MAIN COMPONENT ---
const GameBoard = () => {
  const {
    account, connectWallet, disconnectWallet,
    balance, claimFaucet, nextClaimTime,
    gameState, deal, hit, stand, claimWinnings,
    loading, txLoading, firstGamePlayed, message,
    playSound
  } = useContext(GameContext);

  const [betAmount, setBetAmount] = useState(50);

  // UI States
  const [showDisconnect, setShowDisconnect] = useState(false);
  const walletRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const deckRef = useRef(null);
  const cardRefs = useRef({});
  const prevPlayerLen = useRef(0);
  const prevDealerLen = useRef(0);

  const [flyingCardInfo, setFlyingCardInfo] = useState(null);
  const [invisibleCardId, setInvisibleCardId] = useState(null);
  const [arrivedCardId, setArrivedCardId] = useState(null);





  // --- CARD ANIMATION ---

  useEffect(() => {
    const pLen = gameState.playerHand.length;
    const dLen = gameState.dealerHand.length;

    if (pLen > prevPlayerLen.current) {
      const lastCardId = gameState.playerHand[pLen - 1];
      if (pLen > 2) {
        triggerAnimation(lastCardId);
      } else if (pLen > 0 && gameState.status === "ACTIVE") {
        triggerAnimation(lastCardId);
      }
    }

    if (dLen > prevDealerLen.current) {
      const lastCardId = gameState.dealerHand[dLen - 1];
      if (dLen > 2) {
        triggerAnimation(lastCardId);
      }
    }
    prevPlayerLen.current = pLen;
    prevDealerLen.current = dLen;
  }, [gameState.playerHand, gameState.dealerHand, gameState.status]);


  const triggerAnimation = (cardId) => {
    setFlyingCardInfo(null);
    setInvisibleCardId(null);

    setTimeout(() => {
      const deckEl = deckRef.current;
      const targetEl = cardRefs.current[cardId];

      if (!deckEl || !targetEl) {
        return;
      }

      const start = getScaledPos(deckEl);
      const end = getScaledPos(targetEl);

      setInvisibleCardId(cardId);
      setFlyingCardInfo({
        startPos: start,
        endPos: end,
        cardId: cardId
      });
    }, 100);
  };





  // --- Disconnect Button Onblur ---

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDisconnect && walletRef.current && !walletRef.current.contains(event.target)) {
        setShowDisconnect(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDisconnect]);


  // --- TIMER EFFECT ---
  useEffect(() => {
    if (!nextClaimTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = nextClaimTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        setTimeLeft(formatTime(diff));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextClaimTime]);


  const getBackgroundStyle = () => {
    const min = 10;
    const max = balance;
    const val = betAmount;
    const percentage = ((val - min) / (max - min)) * 95;

    return {
      background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${percentage}%, rgba(17, 17, 17, 0.1) ${percentage}%, rgba(17, 17, 17, 0.1) 100%)`
    };
  };



  const FallingChips = () => {
    const chips = new Array(20).fill(0);

    return (
      <div className="chip-container">
        {chips.map((_, i) => {
          const style = {
            left: `${Math.floor(Math.random() * 100)}%`,
            animationDuration: `${Math.random() * 10 + 2}s`,
            animationDelay: `${Math.random() * 6}s`,
            opacity: Math.random() * 0.4 + 0.2,
            backgroundColor: ['#e74c3c', '#f1c40f', '#3498db', '#34db66', '#000'][Math.floor(Math.random() * 5)]
          };
          return <div key={i} className="falling-chip" style={style} />;
        })}
      </div>
    );
  };

  if (!account) {
    return (
      <div className="connect-screen">
        <div className="cselms">
          <FallingChips />
          <img src={fhejack2} alt="FHEJack Logo" />
          <i>Provably Fair & Encrypted Blackjack Game</i>
          <div className="connect-wallet" onClick={connectWallet}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            Connect Wallet
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="header">

        <div className="hd1">

          <SettingsMenu />

          {/* WALLET DROPDOWN AREA */}
          <div className="wallet-container" ref={walletRef}>
            <div
              className="wallet-info clickable"
              onClick={() => setShowDisconnect(!showDisconnect)}
            >
              <span className="dot"></span> {account.slice(0, 6)}...{account.slice(-4)} ▾
            </div>

            {/* DISCONNECT POPUP */}
            {showDisconnect && (
              <div className="disconnect-menu">
                <button className="btn-disconnect" onClick={() => { setShowDisconnect(false); disconnectWallet(); }}>
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

        </div>

        {/* BALANCE & FAUCET */}
        <div className="balance-box">
          💰 {formatChipDisplay(balance)} Chips
          <button
            className={`btn-small ${timeLeft ? 'disabled' : ''}`}
            onClick={claimFaucet}
            disabled={txLoading || timeLeft}
          >
            {timeLeft ? `⏳ ${timeLeft}` : (<span>+ Faucet</span>)}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table">
        {/* DEALER */}
        <div className="dealer-section">
          <div className="score-badge">DEALER: {gameState.dealerScore}</div>
          <div className="hand">
            {gameState.dealerHand?.map((cardId, i) => {
              const isLast = i === gameState.dealerHand.length - 1;
              const shouldFly = i >= 2 && gameState.status === "ACTIVE";
              const shouldHide = shouldFly && isLast && arrivedCardId !== cardId;

              return (
                <Card
                  key={i}
                  id={cardId}
                  cardRef={(el) => (cardRefs.current[cardId] = el)}
                  isInvisible={invisibleCardId === cardId}
                  isRevealing={i === 1 && gameState.status === "ACTIVE"}
                  justArrived={arrivedCardId === cardId}
                  isWaiting={shouldHide}
                />
              );
            })}

            {gameState.status === "ACTIVE" && gameState.dealerHand.length === 1 && (
              <Card hidden />
            )}
          </div>
        </div>


        <img className="dealer-chips" src={dChips} alt="Dealer Chips" />
        <img
          ref={deckRef}
          className="deck"
          src={deck}
          alt="Deck"
        />
        <img className="watermark" src={fhejack} alt="FHEJack" />



        {/* CONTROLS */}
        <div className="center-section">
          {gameState.status === "IDLE" || gameState.status === "FINISHED" ? (
            <div className="betting-ui">
              <img
                className="pyb"
                src={
                  gameState.status === "FINISHED" && gameState.payout === gameState.bet ? push :
                    gameState.status === "FINISHED" && gameState.payout > 0 ? won :
                      gameState.status === "FINISHED" && gameState.payout === 0 ? gameover :
                        curved
                }
                alt="header"
              />

              {/* SVG CHIP */}
              <div className="svg-chip-wrapper">
                <PokerChipIcon color={getChipColor(betAmount)} size="130px" />
                <span className="chip-value-text">${betAmount}</span>
              </div>

              {/* Range Slider */}
              <div className="range-container">
                <input
                  type="range"
                  min="10"
                  max={balance}
                  step="10"
                  value={betAmount}
                  onChange={(e) => { setBetAmount(Number(e.target.value)); playSound('chip'); }}
                  className="bet-range-slider"
                  style={getBackgroundStyle()}
                  disabled={txLoading}
                />
              </div>

              <div className="action-area">
                {gameState.payout > 0 && gameState.signature ? (
                  <button className="btn-success large glow-effect" onClick={() => claimWinnings(gameState.gameId, gameState.payout, gameState.signature)} disabled={txLoading}>
                    {txLoading ? "Claiming..." : `💰 CLAIM ${gameState.payout}`}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => deal(betAmount)} disabled={txLoading}>
                    {txLoading ? "Dealing..." : "DEAL"}
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="action-ui">
              {/*<div className="pot-display">Pot: {gameState.bet * 2}</div>*/}
              <div className="action-buttons">
                <button className="btn-action hit" onClick={hit} disabled={loading}>HIT</button>
                <button className="btn-action stand" onClick={stand} disabled={loading}>STAND</button>
              </div>
              {/*<div className="result-message">Make your move!</div>*/}
            </div>
          )}
        </div>

        {/* PLAYER */}
        <div className="player-section">
          <div className="score-badge">YOU: {gameState.playerScore}</div>
          <div className="hand">
            {gameState.playerHand?.map((cardId, i) => {
              const isLast = i === gameState.playerHand.length - 1;
              const shouldHide = i >= 2 && isLast && gameState.status === "ACTIVE" && arrivedCardId !== cardId;

              return (
                <Card
                  key={i}
                  id={cardId}
                  cardRef={(el) => (cardRefs.current[cardId] = el)}
                  isInvisible={invisibleCardId === cardId}
                  justArrived={arrivedCardId === cardId}
                  isWaiting={shouldHide}
                />
              );

            })}
            {!firstGamePlayed && <div className="ghost-cardd"></div>}
          </div>

          <div className="dealed-area">
            {
              gameState.status === "ACTIVE" ? (
                <>
                  <PokerChipIcon color={getChipColor(betAmount)} size="95px" />
                  <span className="chip-value-text">${betAmount}</span>
                </>
              ) : null
            }
          </div>
        </div>
        <img className="table-wd" src={wd} alt="Table Background" />
      </div>

      {flyingCardInfo && flyingCardInfo.startPos && flyingCardInfo.endPos && (
        <FlyingCard
          startPos={flyingCardInfo.startPos}
          endPos={flyingCardInfo.endPos}
          onComplete={() => {
            setArrivedCardId(flyingCardInfo.cardId);
            setFlyingCardInfo(null);
            setInvisibleCardId(null);
            setFlyingCardInfo(null);
          }}
        />
      )}



      <AnimatePresence>
        {message && (
          <motion.div
            key="toast-message"
            className="result-message"
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;