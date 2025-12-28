import { PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Budget, DynamoDBBudgetItem } from '../types/common';
import {
  docClient,
  TABLE_NAME,
  generatePK,
  generateBudgetSK,
  generateGSI1PK,
  generateBudgetGSI1SK
} from '../utils/dynamodb';

export class BudgetRepository {
  async createOrUpdate(userId: string, budget: Omit<Budget, 'budgetId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const budgetId = `budget-${uuidv4()}`;
    const now = new Date().toISOString();
    const { year, month, category } = budget;

    // Check if budget exists
    const existing = await this.findByCategory(userId, year, month, category);
    
    const item: DynamoDBBudgetItem = {
      PK: generatePK(userId),
      SK: generateBudgetSK(year, month, category),
      GSI1PK: generateGSI1PK(userId, year, month),
      GSI1SK: generateBudgetGSI1SK(category),
      entityType: 'BUDGET',
      budgetId: existing?.budgetId || budgetId,
      userId,
      ...budget,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return this.mapToBudget(item);
  }

  async findByCategory(userId: string, year: number, month: number, category: string): Promise<Budget | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: generatePK(userId),
        SK: generateBudgetSK(year, month, category)
      }
    }));

    return result.Item ? this.mapToBudget(result.Item as DynamoDBBudgetItem) : null;
  }

  async findByMonth(userId: string, year: number, month: number): Promise<Budget[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'MonthYearIndex',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': generateGSI1PK(userId, year, month),
        ':prefix': 'BUDGET#'
      }
    }));

    return (result.Items || []).map(item => this.mapToBudget(item as DynamoDBBudgetItem));
  }

  async delete(userId: string, year: number, month: number, category: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: generatePK(userId),
        SK: generateBudgetSK(year, month, category)
      }
    }));
  }

  private mapToBudget(item: DynamoDBBudgetItem): Budget {
    return {
      budgetId: item.budgetId,
      userId: item.userId,
      category: item.category,
      monthlyLimit: item.monthlyLimit,
      year: item.year,
      month: item.month,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
