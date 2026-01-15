
import { User } from './types';

const USER_DB_KEY = 'DLG_USER_DATABASE';

const apiDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_ADMIN = {
  id: "dlg_admin_01",
  name: "System Administrator",
  email: "admin@go-service.pl",
  password: "admin",
  dlgId: "DLG-ADM-0001",
  tier: "Paranoia",
  accountType: "Business",
  authProvider: "quantum-direct",
  storageLimit: 10240,
  storageUsed: 50,
  avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=admin",
  agreementAccepted: true
};

export const getLocalUsers = (): any[] => {
  const data = localStorage.getItem(USER_DB_KEY);
  if (!data) {
    const initial = [DEFAULT_ADMIN];
    localStorage.setItem(USER_DB_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [DEFAULT_ADMIN];
  } catch (e) {
    return [DEFAULT_ADMIN];
  }
};

export const updateUser = async (userId: string, updates: Partial<User & { password?: string }>): Promise<User> => {
  await apiDelay(200);
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error("Użytkownik nie istnieje w bazie DLG.");
  
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
  
  const { password, ...safeUser } = updatedUser;
  return safeUser as User;
};

export const registerUser = async (formData: any): Promise<User> => {
  await apiDelay(800);
  const users = getLocalUsers();
  
  if (users.find(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
    throw new Error("Adres e-mail jest już zarejestrowany w sieci.");
  }

  const userId = `dlg_${Math.random().toString(36).substr(2, 9)}`;
  const newUser: User = {
    id: userId,
    name: formData.name,
    email: formData.email,
    avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${formData.name}`,
    dlgId: `DLG-DIR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    storageLimit: 2048,
    storageUsed: 0,
    tier: 'Standard',
    accountType: formData.accountType || 'Personal',
    authProvider: 'quantum-direct',
    primaryStorage: 'local',
    driveConnected: false,
    agreementAccepted: false
  };

  users.push({ ...newUser, password: formData.password });
  localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
  return newUser;
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  await apiDelay(600);
  const users = getLocalUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("Nie znaleziono konta powiązanego z tym adresem e-mail.");
  }

  if (user.password !== pass) {
    throw new Error("Nieprawidłowe hasło. Spróbuj ponownie lub zresetuj hasło.");
  }

  const { password, ...safeUser } = user;
  return safeUser as User;
};

export const getUserByEmail = (email: string) => {
  const users = getLocalUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const resetPasswordWithCode = async (email: string, newPass: string): Promise<User> => {
  await apiDelay(1000);
  const user = getUserByEmail(email);
  if (!user) throw new Error("Użytkownik nie istnieje.");
  
  return await updateUser(user.id, { password: newPass });
};
