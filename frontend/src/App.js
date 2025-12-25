import { useEffect, useState } from "react";
import { GameProvider } from "./context/GameContext.js";
import GameBoard from "./components/GameBoard.js";
import "./App.css";

function App() {
  const [scale, setScale] = useState(1);

  const baseWidth = 1920;
  const baseHeight = 920;

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY);

      setScale(newScale);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setIsPortrait(true);
      } else {
        setIsPortrait(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  if (isPortrait) {
    return (
      <div className="rotate-warning">
        <div className="rotate-icon">📱↻</div>
        <h2>Please Rotate Your Device</h2>
        <p>This game is best experienced in landscape mode.</p>
      </div>
    );
  }

  return (
    <div className="game-viewport">
      <div
        className="game-stage"
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`
        }}
      >
        <GameProvider>
          <GameBoard />
        </GameProvider>
      </div>
    </div>
  );
}

export default App;