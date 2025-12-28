import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { EXPENSE_CATEGORIES } from '../../types';

interface BudgetFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Category"
        {...register('category', { required: true })}
        options={EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
      />

      <Input
        label="Monthly Limit"
        type="number"
        step="0.01"
        {...register('monthlyLimit', { required: 'Monthly limit is required', min: 0.01 })}
        error={errors.monthlyLimit?.message as string}
      />

      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Set Budget
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
