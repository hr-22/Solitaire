// VALIDATION 

// Can `card` land on tableau column `col`?
function canDropOnTableau(card, col) {
    let pile = state.tableau[col];

    if (pile.length === 0) {
        return card.rank === 'K'; // only a King can start an empty column
    }

    let top = pile[pile.length - 1];
    if (!top.faceUp) return false; // can't place on a hidden card

    let differentColor = (card.color !== top.color);
    let oneLower       = (RV[card.rank] === RV[top.rank] - 1);
    return differentColor && oneLower;
}

// Can `card` go onto foundation pile `fi`?
function canDropOnFoundation(card, fi) {
    let pile = state.foundations[fi];

    if (pile.length === 0) {
        return card.rank === 'A'; // foundations start with Aces
    }

    let top      = pile[pile.length - 1];
    let sameSuit = (card.suit === top.suit);
    let oneUp    = (RV[card.rank] === RV[top.rank] + 1);
    return sameSuit && oneUp;
}

// Find the first foundation that will accept `card`, or -1 if none
function autoFindFoundation(card) {
    for (let i = 0; i < 4; i++) {
        if (canDropOnFoundation(card, i)) return i;
    }
    return -1;
}

//  EXECUTION 

// Place the dragged card(s) onto a tableau column
function moveToTableau(col) {
    removeFromSource();
    state.tableau[col].push(...dg.cards);
    if (dg.source === 'waste') addPoints(5);   // waste → tableau: +5
    if (dg.source === 'found') addPoints(-15); // foundation → tableau: -15
    state.moves++;
    revealNewTopCards();
    checkWin();
}

// Place the dragged card onto a foundation pile
function moveToFoundation(fi) {
    removeFromSource();
    state.foundations[fi].push(dg.cards[0]);
    addPoints(10); // any card → foundation: +10
    state.moves++;
    revealNewTopCards();
    checkWin();
}

// Remove the dragged cards from their origin pile
function removeFromSource() {
    if (dg.source === 'tab') {
        // slice from cardIdx onwards; remove those entries
        state.tableau[dg.srcIdx].splice(dg.cardIdx);
    } else if (dg.source === 'waste') {
        state.waste.pop();
    } else if (dg.source === 'found') {
        state.foundations[dg.srcIdx].pop();
    }
}

// After removing cards, flip any newly exposed face-down top cards
function revealNewTopCards() {
    for (let col = 0; col < 7; col++) {
        let pile = state.tableau[col];
        if (pile.length === 0) continue;
        let top = pile[pile.length - 1];
        if (!top.faceUp) {
            top.faceUp = true;
            addPoints(5); // flip bonus
        }
    }
}

// Check if all four foundations have 13 cards (= game complete)
function checkWin() {
    let won = state.foundations.every(function(f) { return f.length === 13; });
    if (won) {
        clearInterval(timerID);
        // Small delay so the last card visually lands before the modal appears
        setTimeout(showWin, 400);
    }
}
