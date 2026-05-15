// All four suits
const SUITS = ['♠', '♥', '♦', '♣'];

// Which colour each suit is
const SUIT_COLOR = {
    '♠': 'blk',
    '♥': 'red',
    '♦': 'red',
    '♣': 'blk'
};

// All 13 ranks in order, Ace lowest
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// Numeric value for each rank: A=1 … K=13
// Used to check if one rank is one step above or below another
const RV = {};
RANKS.forEach(function(rank, index) {
    RV[rank] = index + 1;
});

// How many pixels each card is offset vertically in a tableau column
const FDOFF = 20; // face-down cards stack tightly
const FUOFF = 34; // face-up cards spread out so ranks are readable

// Card pixel dimensions 
const CW = 84;
const CH = 118;
