// Redraw everything on screen to match the current state.
// Called after every move.
function render() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
    document.getElementById('score-el').textContent = state.score;
    document.getElementById('moves-el').textContent = state.moves;
}

function renderStock() {
    let el = document.getElementById('stock');
    el.querySelectorAll('.card').forEach(function(c) { c.remove(); });

    if (state.stock.length > 0) {
        let div = document.createElement('div');
        div.className = 'card fdown';
        div.style.top  = '0';
        div.style.left = '0';
        el.appendChild(div);
        document.getElementById('stock-count').textContent = state.stock.length;
    } else {
        document.getElementById('stock-count').textContent = '';
    }
}

function renderWaste() {
    let el = document.getElementById('waste');
    el.querySelectorAll('.card').forEach(function(c) { c.remove(); });

    if (state.waste.length === 0) return;

    let card = state.waste[state.waste.length - 1];
    let div  = buildCardEl(card);
    div.style.top  = '0';
    div.style.left = '0';
    el.appendChild(div);

    makeDraggable(div, 'waste', 0, state.waste.length - 1);
}

function renderFoundations() {
    for (let i = 0; i < 4; i++) {
        let el   = document.getElementById('f' + i);
        let pile = state.foundations[i];
        el.querySelectorAll('.card').forEach(function(c) { c.remove(); });

        if (pile.length === 0) continue;

        let card = pile[pile.length - 1];
        let div  = buildCardEl(card);
        div.style.top  = '0';
        div.style.left = '0';
        el.appendChild(div);

        // Foundation cards can be dragged back (costs -15 pts via moveToTableau)
        makeDraggable(div, 'found', i, pile.length - 1);
    }
}

function renderTableau() {
    for (let col = 0; col < 7; col++) {
        let el   = document.getElementById('t' + col);
        let pile = state.tableau[col];
        el.querySelectorAll('.card').forEach(function(c) { c.remove(); });

        let topY = 0; // vertical offset for the next card

        for (let i = 0; i < pile.length; i++) {
            let card = pile[i];
            let div  = buildCardEl(card);

            div.style.top    = topY + 'px';
            div.style.left   = '0';
            div.style.zIndex = i + 1; // higher cards sit visually on top

            el.appendChild(div);

            // Clicking a face-down top card flips it
            if (!card.faceUp && i === pile.length - 1) {
                div.style.cursor = 'pointer';
                // Use an IIFE to capture the correct `col` value in the closure
                div.addEventListener('click', (function(c) {
                    return function() { flipTopCard(c); };
                })(col));
            }

            if (card.faceUp) {
                makeDraggable(div, 'tab', col, i);
            }

            topY += card.faceUp ? FUOFF : FDOFF;
        }

        // Make the column tall enough to contain all its cards
        el.style.minHeight = (topY + CH) + 'px';
    }
}

// Build a card <div> from a card data object
function buildCardEl(card) {
    let div = document.createElement('div');
    div.className = 'card';

    if (!card.faceUp) {
        div.classList.add('fdown');
    } else {
        div.classList.add('fup');
        div.classList.add(card.color === 'red' ? 'red-card' : 'blk-card');

        let tl = document.createElement('div');
        tl.className = 'card-corner tl';
        tl.innerHTML =
            '<span class="card-rank">' + card.rank + '</span>' +
            '<span class="card-suit-s">' + card.suit + '</span>';

        let br = document.createElement('div');
        br.className = 'card-corner br';
        br.innerHTML =
            '<span class="card-rank">' + card.rank + '</span>' +
            '<span class="card-suit-s">' + card.suit + '</span>';

        let mid = document.createElement('div');
        mid.className = 'card-mid';
        mid.textContent = card.suit;

        div.appendChild(tl);
        div.appendChild(br);
        div.appendChild(mid);

        div.dataset.rank = card.rank;
        div.dataset.suit = card.suit;
    }

    return div;
}
