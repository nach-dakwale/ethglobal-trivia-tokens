import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface UserData {
  discordId: string;
  walletAddress: string;
}

const DB_PATH = path.join(__dirname, '../../data/users.json');

// Initialize database file if it doesn't exist
async function initDB() {
  try {
    await readFile(DB_PATH);
  } catch {
    await writeFile(DB_PATH, JSON.stringify([], null, 2));
  }
}

// Load users from database
async function loadUsers(): Promise<UserData[]> {
  await initDB();
  const data = await readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Save users to database
async function saveUsers(users: UserData[]) {
  await writeFile(DB_PATH, JSON.stringify(users, null, 2));
}

// Get user's wallet address
export async function getUserWallet(discordId: string): Promise<string | null> {
  const users = await loadUsers();
  const user = users.find(u => u.discordId === discordId);
  return user ? user.walletAddress : null;
}

// Register user's wallet address
export async function registerUserWallet(discordId: string, walletAddress: string): Promise<void> {
  const users = await loadUsers();
  const existingUserIndex = users.findIndex(u => u.discordId === discordId);

  if (existingUserIndex >= 0) {
    users[existingUserIndex].walletAddress = walletAddress;
  } else {
    users.push({ discordId, walletAddress });
  }

  await saveUsers(users);
}

// Initialize database on module load
initDB().catch(console.error); 