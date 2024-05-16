const Piece = require('../Piece');

describe('Piece class', () => {
  test('should create a Piece instance with the given shape, color, and position', () => {
    const shape = [[1], [1], [1], [1]];
    const color = 'cyan';
    const position = { x: 5, y: 0 };
    
    const piece = new Piece(shape, color, position);
    
    expect(piece.shape).toBe(shape);
    expect(piece.color).toBe(color);
    expect(piece.position).toEqual(position);
  });

  test('should clone the position object to avoid shared references', () => {
    const shape = [[1], [1], [1], [1]];
    const color = 'cyan';
    const position = { x: 5, y: 0 };
    
    const piece = new Piece(shape, color, position);
    
    // Modify the original position object
    position.x = 2;
    position.y = 2;
    
    // The piece position should remain unchanged
    expect(piece.position).toEqual({ x: 5, y: 0 });
  });

  test('validateShape should throw an error if the shape is not a non-empty 2D array', () => {
    const invalidShapes = [undefined, null, 0, '', [], 'circle'];
    
    invalidShapes.forEach(shape => {
      expect(() => new Piece(shape, 'cyan', { x: 0, y: 0 })).toThrow('Shape must be a non-empty 2D array.');
    });
  });

  test('createFromTemplate should create a new Piece instance from a template', () => {
    const template = {
      shape: [[1, 1], [1, 1]],
      color: 'yellow',
      position: { x: 5, y: 0 }
    };
    
    const piece = Piece.createFromTemplate(template);
    
    expect(piece.shape).toBe(template.shape);
    expect(piece.color).toBe(template.color);
    expect(piece.position).toEqual(template.position);
  });


  test('should clone a Piece instance', () => {
    const shape = [[1], [1], [1], [1]];
    const color = 'cyan';
    const position = { x: 5, y: 0 };
    
    const piece = new Piece(shape, color, position);
    const clonedPiece = piece.clone();
    
    expect(clonedPiece).not.toBe(piece);
    expect(clonedPiece.shape).toEqual(piece.shape);
    expect(clonedPiece.color).toBe(piece.color);
    expect(clonedPiece.position).toEqual(piece.position);
  });

});
