import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Expense, DynamoDBExpenseItem } from '../types/common';
import {
  docClient,
  TABLE_NAME,
  generatePK,
  generateExpenseSK,
  generateGSI1PK,
  generateExpenseGSI1SK,
  generateGSI2PK,
  generateExpenseGSI2SK
} from '../utils/dynamodb';

export class ExpenseRepository {
  async create(userId: string, expense: Omit<Expense, 'expenseId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const expenseId = `exp-${uuidv4()}`;
    const now = new Date().toISOString();
    const { year, month } = expense;

    const item: DynamoDBExpenseItem = {
      PK: generatePK(userId),
      SK: generateExpenseSK(year, month, expenseId),
      GSI1PK: generateGSI1PK(userId, year, month),
      GSI1SK: generateExpenseGSI1SK(expense.date),
      GSI2PK: generateGSI2PK(userId, expense.category),
      GSI2SK: generateExpenseGSI2SK(year, month, expense.date),
      entityType: 'EXPENSE',
      expenseId,
      userId,
      ...expense,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return this.mapToExpense(item);
  }

  async findById(userId: string, year: number, month: number, expenseId: string): Promise<Expense | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: generatePK(userId),
        SK: generateExpenseSK(year, month, expenseId)
      }
    }));

    return result.Item ? this.mapToExpense(result.Item as DynamoDBExpenseItem) : null;
  }

  async findByMonth(userId: string, year: number, month: number): Promise<Expense[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'MonthYearIndex',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': generateGSI1PK(userId, year, month),
        ':prefix': 'EXPENSE#'
      }
    }));

    return (result.Items || []).map(item => this.mapToExpense(item as DynamoDBExpenseItem));
  }

  async update(userId: string, year: number, month: number, expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const now = new Date().toISOString();
    
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.amount !== undefined) {
      updateExpressions.push('#amount = :amount');
      expressionAttributeNames['#amount'] = 'amount';
      expressionAttributeValues[':amount'] = updates.amount;
    }

    if (updates.category !== undefined) {
      updateExpressions.push('#category = :category');
      expressionAttributeNames['#category'] = 'category';
      expressionAttributeValues[':category'] = updates.category;
    }

    if (updates.description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = updates.description;
    }

    if (updates.date !== undefined) {
      updateExpressions.push('#date = :date');
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':date'] = updates.date;
    }

    if (updates.paymentMode !== undefined) {
      updateExpressions.push('#paymentMode = :paymentMode');
      expressionAttributeNames['#paymentMode'] = 'paymentMode';
      expressionAttributeValues[':paymentMode'] = updates.paymentMode;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: generatePK(userId),
        SK: generateExpenseSK(year, month, expenseId)
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return this.mapToExpense(result.Attributes as DynamoDBExpenseItem);
  }

  async delete(userId: string, year: number, month: number, expenseId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: generatePK(userId),
        SK: generateExpenseSK(year, month, expenseId)
      }
    }));
  }

  private mapToExpense(item: DynamoDBExpenseItem): Expense {
    return {
      expenseId: item.expenseId,
      userId: item.userId,
      amount: item.amount,
      category: item.category,
      description: item.description,
      date: item.date,
      paymentMode: item.paymentMode,
      year: item.year,
      month: item.month,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
