import { EXPENSE_CATEGORIES, PAYMENT_MODES, ExpenseCategory, PaymentMode } from '../types/common';
import { ValidationError } from '../types/api';

export const validateExpense = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  }

  if (data.amount && !Number.isFinite(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  }

  if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
    errors.push({ field: 'category', message: 'Invalid category' });
  }

  if (!data.date || !isValidDate(data.date)) {
    errors.push({ field: 'date', message: 'Invalid date format' });
  }

  if (data.paymentMode && !PAYMENT_MODES.includes(data.paymentMode as PaymentMode)) {
    errors.push({ field: 'paymentMode', message: 'Invalid payment mode' });
  }

  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  return errors;
};

export const validateBudget = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
    errors.push({ field: 'category', message: 'Invalid category' });
  }

  if (!data.monthlyLimit || typeof data.monthlyLimit !== 'number' || data.monthlyLimit <= 0) {
    errors.push({ field: 'monthlyLimit', message: 'Monthly limit must be a positive number' });
  }

  if (!data.month || typeof data.month !== 'number' || data.month < 1 || data.month > 12) {
    errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
  }

  if (!data.year || typeof data.year !== 'number' || data.year < 2000 || data.year > 2100) {
    errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
  }

  return errors;
};

export const validateQueryParams = (month: any, year: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
  }

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
