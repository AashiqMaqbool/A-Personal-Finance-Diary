# Fix Duplicate Expense IDs

## Run in Browser Console (F12)

```javascript
// Fix duplicate expense IDs for aashiq.mq7@gmail.com
const email = 'aashiq.mq7@gmail.com';
const expenseKey = `expense_tracker_expenses_${email}`;

// Get expenses
const expensesData = localStorage.getItem(expenseKey);
if (expensesData) {
  const expenses = JSON.parse(expensesData);
  
  // Remove duplicates by ID (keep first occurrence)
  const seen = new Set();
  const uniqueExpenses = expenses.filter(exp => {
    if (seen.has(exp.expenseId)) {
      console.log(`🗑️ Removing duplicate: ${exp.expenseId}`);
      return false;
    }
    seen.add(exp.expenseId);
    return true;
  });
  
  // Regenerate IDs for any remaining duplicates
  const finalExpenses = uniqueExpenses.map((exp, index) => {
    const newId = `exp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
    return { ...exp, expenseId: newId };
  });
  
  // Save cleaned data
  localStorage.setItem(expenseKey, JSON.stringify(finalExpenses));
  console.log(`✅ Fixed! ${expenses.length} → ${finalExpenses.length} expenses`);
  console.log('✅ Refresh page to see changes');
} else {
  console.log('❌ No expense data found');
}
```

**Then refresh the page (F5)**
