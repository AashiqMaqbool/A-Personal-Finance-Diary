import { getCurrentUser } from './auth';

// Get user-specific storage key
export const getUserStorageKey = (baseKey: string): string => {
  const user = getCurrentUser();
  if (!user) return baseKey; // Fallback
  return `${baseKey}_${user.email}`;
};

// Migrate existing data to specific user (one-time only)
export const migrateDataToUser = (email: string) => {
  // Only migrate for the original user
  if (email !== 'aashiq.mq7@gmail.com') return;
  
  // Check if already migrated
  const migrationKey = `migration_done_${email}`;
  if (localStorage.getItem(migrationKey)) return;

  const keysToMigrate = [
    'goals_data',
    'expense_tracker_expenses',
    'expense_tracker_budgets',
    'salary_tracker_data',
    'salary_company_templates',
    'payslip_room_data',
    'emi_tracker_data',
    'portfolio_data',
    'income_tracker_data',
    'timeline_data'
  ];

  keysToMigrate.forEach(key => {
    const existingData = localStorage.getItem(key);
    if (existingData) {
      const userKey = `${key}_${email}`;
      // Only migrate if user-specific key doesn't exist
      if (!localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, existingData);
      }
    }
  });
  
  // Mark migration as complete
  localStorage.setItem(migrationKey, 'true');
};

// Get user-specific data
export const getUserData = <T>(baseKey: string, defaultValue: T): T => {
  const key = getUserStorageKey(baseKey);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

// Set user-specific data
export const setUserData = <T>(baseKey: string, value: T): void => {
  const key = getUserStorageKey(baseKey);
  localStorage.setItem(key, JSON.stringify(value));
};
