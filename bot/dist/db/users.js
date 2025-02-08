"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWallet = getUserWallet;
exports.registerUserWallet = registerUserWallet;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../data/users.json');
// Initialize database file if it doesn't exist
async function initDB() {
    try {
        await (0, promises_1.readFile)(DB_PATH);
    }
    catch {
        await (0, promises_1.writeFile)(DB_PATH, JSON.stringify([], null, 2));
    }
}
// Load users from database
async function loadUsers() {
    await initDB();
    const data = await (0, promises_1.readFile)(DB_PATH, 'utf-8');
    return JSON.parse(data);
}
// Save users to database
async function saveUsers(users) {
    await (0, promises_1.writeFile)(DB_PATH, JSON.stringify(users, null, 2));
}
// Get user's wallet address
async function getUserWallet(discordId) {
    const users = await loadUsers();
    const user = users.find(u => u.discordId === discordId);
    return user ? user.walletAddress : null;
}
// Register user's wallet address
async function registerUserWallet(discordId, walletAddress) {
    const users = await loadUsers();
    const existingUserIndex = users.findIndex(u => u.discordId === discordId);
    if (existingUserIndex >= 0) {
        users[existingUserIndex].walletAddress = walletAddress;
    }
    else {
        users.push({ discordId, walletAddress });
    }
    await saveUsers(users);
}
// Initialize database on module load
initDB().catch(console.error);
