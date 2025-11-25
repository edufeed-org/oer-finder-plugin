/**
 * Query Builder Mock Factory
 *
 * Provides reusable mock factories for TypeORM SelectQueryBuilder.
 * Used primarily in service tests that interact with repositories.
 */

import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Configuration options for the query builder mock
 */
export interface QueryBuilderMockConfig<T> {
  /** Default result for getMany() */
  getManyResult?: T[];
  /** Default result for getCount() */
  getCountResult?: number;
}

/**
 * Creates a mock SelectQueryBuilder with chainable methods
 *
 * @example
 * ```typescript
 * const queryBuilder = createQueryBuilderMock<OpenEducationalResource>();
 *
 * // Configure specific results
 * jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([mockOer]);
 * jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
 * ```
 */
export function createQueryBuilderMock<T extends ObjectLiteral>(
  config: QueryBuilderMockConfig<T> = {},
): jest.Mocked<SelectQueryBuilder<T>> {
  const { getManyResult = [], getCountResult = 0 } = config;

  const mock = {
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(getCountResult),
    getMany: jest.fn().mockResolvedValue(getManyResult),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<SelectQueryBuilder<T>>;

  return mock;
}

/**
 * Creates a mock repository with createQueryBuilder method
 *
 * @example
 * ```typescript
 * const queryBuilder = createQueryBuilderMock<OpenEducationalResource>();
 * const repository = createRepositoryMock(queryBuilder);
 *
 * // Use in NestJS testing module
 * {
 *   provide: getRepositoryToken(OpenEducationalResource),
 *   useValue: repository,
 * }
 * ```
 */
export function createRepositoryMock<T extends ObjectLiteral>(
  queryBuilder: jest.Mocked<SelectQueryBuilder<T>>,
) {
  return {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
}
