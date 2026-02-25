import { HttpException, HttpStatus } from '@nestjs/common';
import { AssetCorpExceptionFilter } from './asset-corp-exception.filter';

interface MockResponse {
  setHeader: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
}

function createMockHost(response: MockResponse) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as never;
}

describe('AssetCorpExceptionFilter', () => {
  let filter: AssetCorpExceptionFilter;
  let mockResponse: MockResponse;

  beforeEach(() => {
    filter = new AssetCorpExceptionFilter();
    mockResponse = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should set Cross-Origin-Resource-Policy to cross-origin on HttpException', () => {
    const exception = new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );

    filter.catch(exception, createMockHost(mockResponse));

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );
  });

  it('should preserve the original status code and body for HttpException', () => {
    const body = {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'ThrottlerException: Too Many Requests',
    };
    const exception = new HttpException(body, HttpStatus.TOO_MANY_REQUESTS);

    filter.catch(exception, createMockHost(mockResponse));

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(body);
  });

  it('should set CORP header and return 403 for forbidden exceptions', () => {
    const body = {
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Invalid or expired signature',
    };
    const exception = new HttpException(body, HttpStatus.FORBIDDEN);

    filter.catch(exception, createMockHost(mockResponse));

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(body);
  });

  it('should handle non-HttpException errors with status 500', () => {
    const exception = new Error('Unexpected error');

    filter.catch(exception, createMockHost(mockResponse));

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
