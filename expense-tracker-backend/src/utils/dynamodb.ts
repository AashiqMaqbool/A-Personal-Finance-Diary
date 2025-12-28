import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
});

export const TABLE_NAME = process.env.TABLE_NAME || 'ExpenseTrackerTable';

// Key generation utilities
export const generatePK = (userId: string): string => `USER#${userId}`;

export const generateExpenseSK = (year: number, month: number, expenseId: string): string => 
  `EXPENSE#${year}#${String(month).padStart(2, '0')}#${expenseId}`;

export const generateBudgetSK = (year: number, month: number, category: string): string => 
  `BUDGET#${year}#${String(month).padStart(2, '0')}#${category}`;

export const generateGSI1PK = (userId: string, year: number, month: number): string => 
  `USER#${userId}#YEAR#${year}#MONTH#${String(month).padStart(2, '0')}`;

export const generateExpenseGSI1SK = (timestamp: string): string => 
  `EXPENSE#${timestamp}`;

export const generateBudgetGSI1SK = (category: string): string => 
  `BUDGET#${category}`;

export const generateGSI2PK = (userId: string, category: string): string => 
  `USER#${userId}#CATEGORY#${category}`;

export const generateExpenseGSI2SK = (year: number, month: number, timestamp: string): string => 
  `EXPENSE#${year}#${String(month).padStart(2, '0')}#${timestamp}`;
