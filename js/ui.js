// Open a modal by adding the 'show' class
function openModal(id) {
    document.getElementById(id).classList.add('show');
}

// Close a modal by removing the 'show' class
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// Show the How to Play modal
function showHow() {
    openModal('how-modal');
}

// Show the Win modal with final stats
function showWin() {
    document.getElementById('win-pts').textContent   = state.score;
    document.getElementById('win-time').textContent  = 'Time: ' + document.getElementById('timer-el').textContent;
    document.getElementById('win-moves').textContent = 'Moves: ' + state.moves;
    openModal('win-modal');
}
