// Simple secure authentication utility
import CryptoJS from 'crypto-js';

const USERS_KEY = 'findiary_users';
const SESSION_KEY = 'findiary_session';
const SECRET_KEY = 'findiary_secret_2024';

export interface User {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface Session {
  email: string;
  token: string;
  expiresAt: number;
}

// Hash password securely
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + SECRET_KEY).toString();
};

// Initialize with demo user
const initializeUsers = () => {
  const users = getUsers();
  if (users.length === 0) {
    const demoUser: User = {
      email: 'aashiq.mq7@gmail.com',
      passwordHash: hashPassword('FinDiary@2024'),
      name: 'Aashiq',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]));
  }
};

// Get all users
const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Register new user
export const register = (email: string, password: string, name: string): { success: boolean; message: string } => {
  const users = getUsers();
  
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'Email already registered' };
  }

  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters' };
  }

  const newUser: User = {
    email,
    passwordHash: hashPassword(password),
    name,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return { success: true, message: 'Registration successful' };
};

// Login user
export const login = (email: string, password: string): { success: boolean; message: string } => {
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return { success: false, message: 'Invalid email or password' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Create session token
  const token = CryptoJS.SHA256(email + Date.now() + SECRET_KEY).toString();
  const session: Session = {
    email,
    token,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  return { success: true, message: 'Login successful' };
};

// Logout user
export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Get current session
export const getSession = (): Session | null => {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;

  const session: Session = JSON.parse(data);
  
  // Check if session expired
  if (session.expiresAt < Date.now()) {
    logout();
    return null;
  }

  return session;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

// Get current user
export const getCurrentUser = (): User | null => {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  return users.find(u => u.email === session.email) || null;
};

// Initialize on load
initializeUsers();
