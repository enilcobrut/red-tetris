const { FORMS, rotate, getRandomPiece } = require('../tetris/pieces');

describe('Tetris Pieces', () => {
    test('FORMS should contain the correct predefined shapes and colors', () => {
        const expectedForms = [
            { shape: [[1, 1, 1, 1]], color: 'cyan' }, // I
            { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O
            { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }, // T
            { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' }, // J
            { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue' }, // L
            { shape: [[0, 1, 1], [1, 1, 0]], color: 'red' }, // S
            { shape: [[1, 1, 0], [0, 1, 1]], color: 'green' } // Z
        ];
        expect(FORMS).toEqual(expectedForms);
    });

    test('rotate should rotate a piece 90 degrees clockwise', () => {
        const piece = [
            [1, 0],
            [1, 1],
            [1, 0]
        ];
        const expectedRotatedPiece = [
            [1, 1, 1],
            [0, 1, 0]
        ];
        const rotatedPiece = rotate(piece);
        expect(rotatedPiece).toEqual(expectedRotatedPiece);
    });

    test('getRandomPiece should return a piece with shape, color, and initial position', () => {
        const piece = getRandomPiece();
        expect(piece).toHaveProperty('shape');
        expect(piece).toHaveProperty('color');
        expect(piece).toHaveProperty('position');
        expect(piece.position).toEqual({ x: 5, y: 0 });
    });

    test('getRandomPiece should return a valid piece from FORMS', () => {
        const piece = getRandomPiece();
        const validShapes = FORMS.map(form => form.shape);
        const validColors = FORMS.map(form => form.color);

        expect(validShapes).toContainEqual(piece.shape);
        expect(validColors).toContain(piece.color);
    });
});
