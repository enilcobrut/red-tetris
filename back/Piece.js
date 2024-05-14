// class Piece {
//     constructor() {
//         const pieces = [
//             // Barre (I) - Verticale
//             { shape: [[1], [1], [1], [1]], color: 'cyan', position: { x: 5, y: 0 } },
        
//             // Carré (O) - Aucun changement nécessaire
//             { shape: [[1, 1], [1, 1]], color: 'yellow', position: { x: 5, y: 0 } },
        
//             // T (T) - Pas de changement dans l'orientation mais ajustement possible si nécessaire
//             { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple', position: { x: 5, y: 0 } },
        
//             // L (J) - Pas de changement, déjà en forme "L"
//             { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange', position: { x: 5, y: 0 } },
        
//             // L inversé (L) - Pas de changement, déjà en forme "L" inversé
//             { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue', position: { x: 5, y: 0 } },
        
//             // S (Z)
//             { shape: [[0, 1, 1], [1, 1, 0]], color: 'red', position: { x: 5, y: 0 } },
        
//             // Z (S)
//             { shape: [[1, 1, 0], [0, 1, 1]], color: 'green', position: { x: 5, y: 0 } }
//         ];
        
//         const randomIndex = Math.floor(Math.random() * pieces.length);
//         const randomPiece = pieces[randomIndex];

//         this.shape = randomPiece.shape;
//         this.color = randomPiece.color;
//         this.position = randomPiece.position;
//     }

//     moveDown() {
//         this.position.y += 1;
//     }
    
//     moveLeft() {
//         this.position.x -= 1;
//     }
    
//     moveRight() {
//         this.position.x += 1;
//     }
//     rotate(clockwise = true) {
//         let rotatedShape = [];
//         const rows = this.shape.length;
//         const cols = this.shape[0].length;

//         for (let col = 0; col < cols; col++) {
//             let newRow = [];
//             for (let row = 0; row < rows; row++) {
//                 newRow.push(this.shape[row][cols - 1 - col]);
//             }
//             rotatedShape.push(newRow);
//         }

//         if (!clockwise) {
//             rotatedShape = rotatedShape.map(row => row.reverse());
//             rotatedShape.reverse();
//         }

//         this.shape = rotatedShape;
//     }

// }

// module.exports = Piece;


class Piece {
    constructor(shape, color, position) {
        this.shape = shape;
        this.color = color;
        this.position = {...position}; // Clone l'objet position pour éviter les références partagées
    }




    static createFromTemplate(template) {
        return new Piece(template.shape, template.color, template.position);
    }
}

module.exports = Piece;
