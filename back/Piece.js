class Piece {
    constructor(shape, color, position) {
        this.shape = this.validateShape(shape);
        this.color = color;
        this.position = { ...position }; // Clone the position object to avoid shared references
    }

    static createFromTemplate(template) {
        return new Piece(template.shape, template.color, template.position);
    }

    // Validate that the shape is a non-empty 2D array
    validateShape(shape) {
        if (!Array.isArray(shape) || shape.length === 0 || !Array.isArray(shape[0])) {
            throw new Error('Shape must be a non-empty 2D array.');
        }
        return shape;
    }

    // Clone the Piece instance
    clone() {
        return new Piece(this.shape, this.color, { ...this.position });
    }

}

module.exports = Piece;