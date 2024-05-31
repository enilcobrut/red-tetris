const fs = require('fs');
const path = require('path');
const {
    readJsonFile,
    writeJsonFile,
    PERSONAL_BEST_FILE,
    LEADERBOARD_FILE,
    STAT_FILE
} = require('../JsonHandlers');

// Mock the fs methods
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
}));

describe('JsonHandlers', () => {
    const mockData = [{ username: 'player1', score: 100 }];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('readJsonFile', () => {
        it('should read and parse the JSON file correctly', () => {
            fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockData));

            const result = readJsonFile('mockFilePath');
            expect(fs.readFileSync).toHaveBeenCalledWith('mockFilePath', 'utf8');
            expect(result).toEqual(mockData);
        });

        it('should return an empty array if the file does not exist', () => {
            fs.readFileSync.mockImplementationOnce(() => { throw { code: 'ENOENT' }; });

            const result = readJsonFile('mockFilePath');
            expect(fs.readFileSync).toHaveBeenCalledWith('mockFilePath', 'utf8');
            expect(result).toEqual([]);
        });

        it('should throw an error for other read errors', () => {
            const error = new Error('Some other error');
            fs.readFileSync.mockImplementationOnce(() => { throw error; });

            expect(() => readJsonFile('mockFilePath')).toThrow(error);
            expect(fs.readFileSync).toHaveBeenCalledWith('mockFilePath', 'utf8');
        });
    });

    describe('writeJsonFile', () => {
        it('should write the data to the JSON file correctly', () => {
            writeJsonFile('mockFilePath', mockData);

            expect(fs.writeFileSync).toHaveBeenCalledWith('mockFilePath', JSON.stringify(mockData, null, 2), 'utf8');
        });

        it('should throw an error if writing fails', () => {
            const error = new Error('Write error');
            fs.writeFileSync.mockImplementationOnce(() => { throw error; });

            expect(() => writeJsonFile('mockFilePath', mockData)).toThrow(error);
            expect(fs.writeFileSync).toHaveBeenCalledWith('mockFilePath', JSON.stringify(mockData, null, 2), 'utf8');
        });
    });

    describe('file paths', () => {
        it('should have correct PERSONAL_BEST_FILE path', () => {
            const expectedPath = path.join(__dirname, '../db/PersonalBest.json');
            expect(PERSONAL_BEST_FILE).toBe(expectedPath);
        });

        it('should have correct LEADERBOARD_FILE path', () => {
            const expectedPath = path.join(__dirname, '../db/Leaderboard.json');
            expect(LEADERBOARD_FILE).toBe(expectedPath);
        });

        it('should have correct STAT_FILE path', () => {
            const expectedPath = path.join(__dirname, '../db/Statistics.json');
            expect(STAT_FILE).toBe(expectedPath);
        });
    });
});
