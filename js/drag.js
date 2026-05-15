// Attach a mousedown handler so the card can be dragged.
// source  — 'tab', 'waste', or 'found'
// srcIdx  — column index or foundation index
// cardIdx — position within the pile
function makeDraggable(el, source, srcIdx, cardIdx) {
    el.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // ignore right-clicks
        e.preventDefault();
        e.stopPropagation();
        initDrag(e, source, srcIdx, cardIdx);
    });
}

// Record everything about the drag that is starting
function initDrag(e, source, srcIdx, cardIdx) {
    let cards = getCardsForDrag(source, srcIdx, cardIdx);
    if (!cards || cards.length === 0) return;

    let rect = e.currentTarget.getBoundingClientRect();

    dg = {
        source:  source,
        srcIdx:  srcIdx,
        cardIdx: cardIdx,
        cards:   cards,
        offX:    e.clientX - rect.left, // cursor position relative to card corner
        offY:    e.clientY - rect.top,
        startX:  e.clientX,
        startY:  e.clientY,
        moved:   false // becomes true once cursor moves 4+ pixels
    };
}

// Return the cards that will travel together during this drag
function getCardsForDrag(source, srcIdx, cardIdx) {
    if (source === 'tab') {
        // Grab this card and every card stacked on top of it
        return state.tableau[srcIdx].slice(cardIdx);
    } else if (source === 'waste') {
        return [state.waste[state.waste.length - 1]];
    } else if (source === 'found') {
        let pile = state.foundations[srcIdx];
        return [pile[pile.length - 1]];
    }
    return [];
}

// Mouse move — move the floating ghost and highlight drop targets
document.addEventListener('mousemove', function(e) {
    if (!dg) return;

    // This prevents accidental drags triggered by tiny hand tremors.
    if (!dg.moved) {
        let dx = e.clientX - dg.startX;
        let dy = e.clientY - dg.startY;
        if (Math.sqrt(dx * dx + dy * dy) < 4) return;
        dg.moved = true;
        buildGhost();
        markSourceGhost(true);
    }

    let layer = document.getElementById('drag-layer');
    layer.style.left = (e.clientX - dg.offX) + 'px';
    layer.style.top  = (e.clientY - dg.offY) + 'px';

    highlightTargets(dg.cards[0]);
});

// Build the floating stack of card clones that follows the cursor
function buildGhost() {
    let layer = document.getElementById('drag-layer');
    layer.innerHTML = '';
    layer.style.display = 'block';
    layer.style.width   = CW + 'px';
    layer.style.height  = (CH + (dg.cards.length - 1) * FUOFF) + 'px';

    dg.cards.forEach(function(card, i) {
        let div = buildCardEl(card);
        div.style.top    = (i * FUOFF) + 'px';
        div.style.zIndex = i + 1;
        layer.appendChild(div);
    });
}

// Fade out the original card(s) while dragging so the player can see the gap
function markSourceGhost(on) {
    if (!dg) return;
    let targets = [];

    if (dg.source === 'tab') {
        let col = document.getElementById('t' + dg.srcIdx);
        targets  = Array.from(col.querySelectorAll('.card')).slice(dg.cardIdx);
    } else if (dg.source === 'waste') {
        let c = document.getElementById('waste').querySelector('.card');
        if (c) targets = [c];
    } else if (dg.source === 'found') {
        let c = document.getElementById('f' + dg.srcIdx).querySelector('.card');
        if (c) targets = [c];
    }

    targets.forEach(function(el) { el.classList.toggle('ghost', on); });
}

// Highlight all piles that will legally accept the top dragged card
function highlightTargets(topCard) {
    clearHighlights();

    for (let col = 0; col < 7; col++) {
        if (dg.source === 'tab' && dg.srcIdx === col) continue; // skip the source column
        if (canDropOnTableau(topCard, col)) {
            document.getElementById('t' + col).classList.add('valid-target');
        }
    }

    // Only a single card can go to a foundation
    if (dg.cards.length === 1) {
        for (let i = 0; i < 4; i++) {
            if (canDropOnFoundation(topCard, i)) {
                document.getElementById('f' + i).classList.add('valid-target');
            }
        }
    }
}

function clearHighlights() {
    document.querySelectorAll('.valid-target').forEach(function(el) {
        el.classList.remove('valid-target');
    });
}

// Mouse up — attempt to complete the drop
document.addEventListener('mouseup', function(e) {
    if (!dg) return;

    let wasDragged = dg.moved;

    let layer = document.getElementById('drag-layer');
    layer.style.display = 'none';

    if (wasDragged) {
        // Ghost is hidden, so elementFromPoint reveals what is underneath
        let elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        let targetPile   = findPileElement(elementUnder);

        if (targetPile) {
            tryDrop(targetPile);
        }

        layer.innerHTML = '';
        clearHighlights();
        dg = null;
        render();
    } else {
        dg = null; // was just a click; click/dblclick handlers take over
    }
});

// Walk up the DOM to find a pile or column element
function findPileElement(el) {
    while (el && el !== document.body) {
        if (el.classList && (el.classList.contains('tab-col') || el.classList.contains('pile-slot'))) {
            return el;
        }
        if (el.classList && el.classList.contains('card')) {
            let parent = el.parentElement;
            if (parent && (parent.classList.contains('tab-col') || parent.classList.contains('pile-slot'))) {
                return parent;
            }
        }
        el = el.parentElement;
    }
    return null;
}

// Try to complete the drop on the target element
function tryDrop(targetEl) {
    let id = targetEl.id;

    if (id && /^t[0-6]$/.test(id)) {
        let col = parseInt(id[1]);
        if (dg.source === 'tab' && dg.srcIdx === col) return;
        if (canDropOnTableau(dg.cards[0], col)) {
            saveUndo();
            moveToTableau(col);
        }
    }

    if (id && /^f[0-3]$/.test(id)) {
        let fi = parseInt(id[1]);
        if (dg.cards.length === 1 && canDropOnFoundation(dg.cards[0], fi)) {
            saveUndo();
            moveToFoundation(fi);
        }
    }
}

// Double-click a face-up card to auto-send it to a foundation
document.addEventListener('dblclick', function(e) {
    let cardEl = e.target.closest('.card.fup');
    if (!cardEl) return;

    let parent = cardEl.parentElement;
    if (!parent) return;

    let card     = null;
    let fakeDrag = null;

    if (parent.id === 'waste') {
        card     = state.waste[state.waste.length - 1];
        fakeDrag = { source: 'waste', srcIdx: 0, cardIdx: state.waste.length - 1, cards: [card] };
    } else if (parent.id && /^t[0-6]$/.test(parent.id)) {
        let col  = parseInt(parent.id[1]);
        let pile = state.tableau[col];
        card     = pile[pile.length - 1];
        if (!card || !card.faceUp) return;
        fakeDrag = { source: 'tab', srcIdx: col, cardIdx: pile.length - 1, cards: [card] };
    } else {
        return;
    }

    let fi = autoFindFoundation(card);
    if (fi === -1) return;

    saveUndo();
    dg = fakeDrag; // moveToFoundation reads from dg
    moveToFoundation(fi);
    dg = null;
    render();
});
