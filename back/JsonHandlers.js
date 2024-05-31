const fs = require('fs');
const path = require('path');

const PERSONAL_BEST_FILE = path.join(__dirname, 'db/PersonalBest.json');
const LEADERBOARD_FILE = path.join(__dirname, 'db/Leaderboard.json');
const STAT_FILE = path.join(__dirname, 'db/Statistics.json');

function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    readJsonFile,
    writeJsonFile,
    PERSONAL_BEST_FILE,
    LEADERBOARD_FILE,
    STAT_FILE
};
