import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ExpenseService } from '../services/ExpenseService';
import { validateExpense, validateQueryParams } from '../utils/validation';
import { createSuccessResponse, createErrorResponse } from '../types/api';

const expenseService = new ExpenseService();
const DEFAULT_USER_ID = 'user123'; // Replace with Cognito user ID in production

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // POST /expenses - Create expense
    if (method === 'POST' && path === '/expenses') {
      const body = JSON.parse(event.body || '{}');
      const errors = validateExpense(body);

      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, errors);
      }

      const expense = await expenseService.createExpense(DEFAULT_USER_ID, body);
      return createSuccessResponse(expense, 'Expense created successfully', 201);
    }

    // GET /expenses?month=5&year=2024 - Get expenses by month
    if (method === 'GET' && path === '/expenses' && event.queryStringParameters) {
      const { month, year } = event.queryStringParameters;
      const errors = validateQueryParams(month, year);

      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, errors);
      }

      const expenses = await expenseService.getExpensesByMonth(
        DEFAULT_USER_ID,
        parseInt(year!),
        parseInt(month!)
      );

      return createSuccessResponse({
        expenses,
        total: expenses.length,
        month: parseInt(month!),
        year: parseInt(year!)
      });
    }

    // GET /expenses/{id} - Get single expense
    if (method === 'GET' && path.startsWith('/expenses/')) {
      const pathParts = path.split('/');
      const expenseId = pathParts[2];
      const { year, month } = event.queryStringParameters || {};

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      const expense = await expenseService.getExpense(
        DEFAULT_USER_ID,
        parseInt(year),
        parseInt(month),
        expenseId
      );

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(expense);
    }

    // PUT /expenses/{id} - Update expense
    if (method === 'PUT' && path.startsWith('/expenses/')) {
      const pathParts = path.split('/');
      const expenseId = pathParts[2];
      const body = JSON.parse(event.body || '{}');
      const { year, month } = event.queryStringParameters || {};

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      const errors = validateExpense(body);
      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, errors);
      }

      const expense = await expenseService.updateExpense(
        DEFAULT_USER_ID,
        parseInt(year),
        parseInt(month),
        expenseId,
        body
      );

      return createSuccessResponse(expense, 'Expense updated successfully');
    }

    // DELETE /expenses/{id} - Delete expense
    if (method === 'DELETE' && path.startsWith('/expenses/')) {
      const pathParts = path.split('/');
      const expenseId = pathParts[2];
      const { year, month } = event.queryStringParameters || {};

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      await expenseService.deleteExpense(
        DEFAULT_USER_ID,
        parseInt(year),
        parseInt(month),
        expenseId
      );

      return createSuccessResponse(null, 'Expense deleted successfully');
    }

    return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
};
