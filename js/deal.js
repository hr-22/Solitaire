// Build a fresh shuffled deck and deal it into the standard Solitaire layout
function newGame() {
    // Stop any running timer
    clearInterval(timerID);
    elapsed = 0;
    history = [];
    dg = null;

    // Build 52 cards
    let deck = [];
    SUITS.forEach(function(suit) {
        RANKS.forEach(function(rank) {
            deck.push({
                suit:   suit,
                rank:   rank,
                color:  SUIT_COLOR[suit],
                faceUp: false
            });
        });
    });

    // Fisher-Yates shuffle for a random order
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = deck[i];
        deck[i] = deck[j];
        deck[j] = tmp;
    }

    // Deal into tableau: column 0 gets 1 card, column 1 gets 2, … column 6 gets 7
    let tableau = [];
    for (let col = 0; col < 7; col++) {
        tableau.push([]);
    }

    let deckIdx = 0;
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            let card = deck[deckIdx++];
            // Only the top card of each column starts face-up
            card.faceUp = (row === col);
            tableau[col].push(card);
        }
    }

    // The rest of the deck goes to the stock pile, face-down
    let stock = deck.slice(deckIdx);

    state = {
        stock:       stock,
        waste:       [],
        foundations: [[], [], [], []],
        tableau:     tableau,
        score:       0,
        moves:       0
    };

    // Start the timer
    timerID = setInterval(tickTimer, 1000);

    render();
}

// Called every second to update the timer display
function tickTimer() {
    elapsed++;
    let mins = Math.floor(elapsed / 60);
    let secs = elapsed % 60;
    // Pad seconds with a leading zero: 1:05 
    document.getElementById('timer-el').textContent =
        mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// Click the stock pile: flip one card to waste, or reset if empty
function clickStock() {
    if (state.stock.length > 0) {
        let card = state.stock.pop();
        card.faceUp = true;
        state.waste.push(card);
        state.moves++;
    } else {
        // Recycling costs points
        saveUndo();
        addPoints(-100);
        // Flip waste back into stock, face-down
        state.stock = state.waste.reverse().map(function(c) {
            c.faceUp = false;
            return c;
        });
        state.waste = [];
    }
    render();
}

// Flip the top face-down card in a tableau column
function flipTopCard(col) {
    let pile = state.tableau[col];
    let top  = pile[pile.length - 1];
    if (!top || top.faceUp) return;
    saveUndo();
    top.faceUp = true;
    addPoints(5); // reward for uncovering a card
    state.moves++;
    render();
}
