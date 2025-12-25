const getCardValue = (cardId) => {
    const rankIndex = cardId % 13;
    if (rankIndex === 0) return 11;
    if (rankIndex >= 10) return 10;
    return rankIndex + 1;
};

const calculateHand = (handIds) => {
    let score = 0;
    let aceCount = 0;

    handIds.forEach(id => {
        const val = getCardValue(id);
        if (val === 11) aceCount++;
        score += val;
    });

    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }

    return score;
};

const createDeck = (seedInput) => {
    let seed;
    try {
        if (!seedInput) {
            seed = Math.floor(Math.random() * 1000000);
        } else {
            if (typeof seedInput === 'object') {
                seed = Math.floor(Math.random() * 1000000);
            } else {
                const seedStr = String(seedInput);
                if (/^-?\d+n?$/.test(seedStr)) {
                    seed = Number(BigInt(seedStr) % 1000000n);
                } else {
                    seed = Math.floor(Math.random() * 1000000);
                }
            }
        }
    } catch (e) {
        seed = Math.floor(Math.random() * 1000000);
    }
    
    let deck = Array.from({ length: 52 }, (_, i) => i);
    
    let m = deck.length, t, i;
    while (m) {
        i = Math.floor((Math.sin(seed + m) * 10000) % 1 * m); 
        if(i < 0) i = i * -1;
        
        m--;
        t = deck[m];
        deck[m] = deck[i];
        deck[i] = t;
    }
    
    return deck;
};

export { createDeck, calculateHand, getCardValue };