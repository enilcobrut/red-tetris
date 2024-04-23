class Piece {
    constructor() {
        const pieces = [
            { shape: [[1, 1, 1, 1]], color: 'cyan', position: { x: 5, y: 0 } },
            { shape: [[1, 1], [1, 1]], color: 'yellow', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple', position: { x: 5, y: 0 } },
            { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange', position: { x: 5, y: 0 } },
            { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 1], [1, 1, 0]], color: 'red', position: { x: 5, y: 0 } },
            { shape: [[1, 1, 0], [0, 1, 1]], color: 'green', position: { x: 5, y: 0 } }
        ];
        const randomIndex = Math.floor(Math.random() * pieces.length);
        const randomPiece = pieces[randomIndex];

        this.shape = randomPiece.shape;
        this.color = randomPiece.color;
        this.position = randomPiece.position;
    }

    // Method to rotate the piece 90 degrees clockwise
    rotate() {
        let rotatedPiece = [];
        for (let col = 0; col < this.shape[0].length; col++) {
            let newRow = [];
            for (let row = this.shape.length - 1; row >= 0; row--) {
                newRow.push(this.shape[row][col]);
            }
            rotatedPiece.push(newRow);
        }
        this.shape = rotatedPiece;
    }
}

module.exports = Piece;
