import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BudgetService } from '../services/BudgetService';
import { validateBudget, validateQueryParams } from '../utils/validation';
import { createSuccessResponse, createErrorResponse } from '../types/api';

const budgetService = new BudgetService();
const DEFAULT_USER_ID = 'user123'; // Replace with Cognito user ID in production

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // POST /budgets - Create/update budget
    if (method === 'POST' && path === '/budgets') {
      const body = JSON.parse(event.body || '{}');
      const errors = validateBudget(body);

      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, errors);
      }

      const budget = await budgetService.createOrUpdateBudget(DEFAULT_USER_ID, body);
      return createSuccessResponse(budget, 'Budget created successfully', 201);
    }

    // GET /budgets?month=5&year=2024 - Get budgets by month
    if (method === 'GET' && path === '/budgets' && event.queryStringParameters) {
      const { month, year } = event.queryStringParameters;
      const errors = validateQueryParams(month, year);

      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, errors);
      }

      const budgets = await budgetService.getBudgetsByMonth(
        DEFAULT_USER_ID,
        parseInt(year!),
        parseInt(month!)
      );

      const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      const totalRemaining = totalBudget - totalSpent;

      return createSuccessResponse({
        budgets,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        month: parseInt(month!),
        year: parseInt(year!)
      });
    }

    // DELETE /budgets/{category} - Delete budget
    if (method === 'DELETE' && path.startsWith('/budgets/')) {
      const pathParts = path.split('/');
      const category = decodeURIComponent(pathParts[2]);
      const { year, month } = event.queryStringParameters || {};

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      await budgetService.deleteBudget(
        DEFAULT_USER_ID,
        parseInt(year),
        parseInt(month),
        category
      );

      return createSuccessResponse(null, 'Budget deleted successfully');
    }

    return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
};
