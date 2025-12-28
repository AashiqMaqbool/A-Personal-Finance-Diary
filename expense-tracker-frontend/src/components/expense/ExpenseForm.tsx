import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { EXPENSE_CATEGORIES, PAYMENT_MODES, Expense } from '../../types';

interface ExpenseFormProps {
  onSubmit: (data: any) => void;
  initialData?: Expense;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      amount: 0,
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Amount"
        type="number"
        step="0.01"
        {...register('amount', { required: 'Amount is required', min: 0.01 })}
        error={errors.amount?.message}
      />

      <Select
        label="Category"
        {...register('category', { required: true })}
        options={EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
      />

      <Input
        label="Description"
        {...register('description')}
      />

      <Input
        label="Date"
        type="date"
        {...register('date', { required: 'Date is required' })}
        error={errors.date?.message}
      />

      <Select
        label="Payment Mode"
        {...register('paymentMode')}
        options={PAYMENT_MODES.map(mode => ({ value: mode, label: mode }))}
      />

      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {initialData ? 'Update' : 'Add'} Expense
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
