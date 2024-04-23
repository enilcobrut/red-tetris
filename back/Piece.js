class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
    }

    static getRandomPiece(pieces) {
        const randomIndex = Math.floor(Math.random() * pieces.length);
        const selectedPiece = pieces[randomIndex];
        return new Piece(selectedPiece.shape, selectedPiece.color);
    }

    rotate() {
        // Rotate the piece 90 degrees clockwise
        const newShape = [];
        for (let x = 0; x < this.shape[0].length; x++) {
            newShape.push(this.shape.map(row => row[x]).reverse());
        }
        this.shape = newShape;
    }
}
module.exports = Piece;
