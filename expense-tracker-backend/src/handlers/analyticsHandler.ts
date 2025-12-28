import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AnalyticsService } from '../services/AnalyticsService';
import { validateQueryParams } from '../utils/validation';
import { createSuccessResponse, createErrorResponse } from '../types/api';

const analyticsService = new AnalyticsService();
const DEFAULT_USER_ID = 'user123'; // Replace with Cognito user ID in production

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // GET /analytics?month=5&year=2024 - Get monthly analytics
    if (method === 'GET' && path === '/analytics' && event.queryStringParameters) {
      const { month, year } = event.queryStringParameters;
      const errors = validateQueryParams(month, year);

      if (errors.length > 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, errors);
      }

      const analytics = await analyticsService.getMonthlyAnalytics(
        DEFAULT_USER_ID,
        parseInt(year!),
        parseInt(month!)
      );

      return createSuccessResponse(analytics);
    }

    return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500);
  }
};
