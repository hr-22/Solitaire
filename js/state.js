// The whole game lives in this one object.
// We change it, then call render() to update the screen.
let state = {};

// Undo stack — each entry is a full copy of state before a move
let history = [];

// Timer
let timerID = null; // reference returned by setInterval so we can stop it
let elapsed = 0;    // seconds counted so far

// Drag state — null when nothing is being dragged
let dg = null;

// Make a deep copy of any object using JSON.
// This ensures undo snapshots don't share references with live state.
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Save current state before each move so the player can step back
function saveUndo() {
    if (history.length >= 40) {
        history.shift(); // keep memory reasonable
    }
    history.push(deepCopy(state));
}

// Restore the last saved state
function undo() {
    if (history.length === 0) return;
    state = history.pop();
    render();
}

// Change the score, never letting it drop below zero
function addPoints(n) {
    state.score = Math.max(0, state.score + n);
}
