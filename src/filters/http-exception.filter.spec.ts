import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { headersSent: false, status };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  return { host, response, status, json };
}

describe('HttpExceptionFilter', () => {
  describe('in production mode', () => {
    const filter = new HttpExceptionFilter('production');

    it('should pass through HttpException responses', () => {
      const { host, status, json } = createMockHost();
      const exception = new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Bad Request',
      });
    });

    it('should return generic 500 for non-HttpException errors', () => {
      const { host, status, json } = createMockHost();

      filter.catch(new Error('Database connection failed'), host);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });

    it('should return generic 500 for non-Error exceptions', () => {
      const { host, status, json } = createMockHost();

      filter.catch('string error', host);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });
  });

  describe('in development mode', () => {
    const filter = new HttpExceptionFilter('development');

    it('should include error message for non-HttpException errors', () => {
      const { host, status, json } = createMockHost();

      filter.catch(new Error('Detailed error info'), host);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Detailed error info',
      });
    });
  });

  it('should not send response if headers already sent', () => {
    const filter = new HttpExceptionFilter('production');
    const { host, response, status } = createMockHost();
    response.headersSent = true;

    filter.catch(new Error('test'), host);

    expect(status).not.toHaveBeenCalled();
  });
});
