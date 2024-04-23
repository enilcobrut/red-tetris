// back/tetris/pieces.js
const FORMS = [
    { shape: [[1, 1, 1, 1]], color: 'cyan' }, // I
    { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue' }, // L
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'red' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'green' } // Z
];

/**
 * Rotate a piece by 90 degrees clockwise.
 * @param {Array<Array<number>>} piece - The 2D array representing the Tetris piece.
 * @return {Array<Array<number>>} The rotated piece.
 */
const rotate = (piece) => {
    // Transpose the matrix
    let rotatedPiece = piece[0].map((val, index) => piece.map(row => row[index]));
    rotatedPiece.forEach(row => row.reverse());
    return rotatedPiece;
};


/**
 * Get a random piece from the predefined forms.
 * @return {Object} A piece object with shape and color.
 */
// back/tetris/pieces.js
const getRandomPiece = () => {
    const randomIndex = Math.floor(Math.random() * FORMS.length);
    let piece = { ...FORMS[0] };
    console.log(piece);
    piece.position = { x: 5, y: 0 };
    return piece;
};

module.exports = { FORMS, rotate, getRandomPiece };
