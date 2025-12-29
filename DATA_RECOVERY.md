# Data Recovery for aashiq.mq7@gmail.com

## Quick Fix - Run in Browser Console

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)

2. **Copy and paste this code:**

```javascript
// Clear migration flag to force re-migration
localStorage.removeItem('migration_done_aashiq.mq7@gmail.com');

// Manual migration for aashiq.mq7@gmail.com
const email = 'aashiq.mq7@gmail.com';
const keysToMigrate = [
  'goals_data',
  'expense_tracker_expenses',
  'expense_tracker_budgets',
  'salary_tracker_data',
  'salary_company_templates',
  'payslip_room_data',
  'emi_tracker_data',
  'portfolio_data'
];

keysToMigrate.forEach(key => {
  const existingData = localStorage.getItem(key);
  if (existingData) {
    const userKey = `${key}_${email}`;
    localStorage.setItem(userKey, existingData);
    console.log(`✅ Migrated: ${key} → ${userKey}`);
  } else {
    console.log(`⚠️ No data found for: ${key}`);
  }
});

console.log('✅ Migration complete! Refresh the page.');
```

3. **Press Enter**

4. **Refresh the page** (F5)

5. **Login** with aashiq.mq7@gmail.com / FinDiary@2024

Your data should be back!

---

## Alternative: Check What Data Exists

Run this to see what data is in localStorage:

```javascript
// List all localStorage keys
Object.keys(localStorage).forEach(key => {
  console.log(key);
});
```

Look for keys like:
- `goals_data`
- `expense_tracker_expenses`
- `expense_tracker_budgets`
- `salary_tracker_data`

If you see these, the migration script above will restore them.
