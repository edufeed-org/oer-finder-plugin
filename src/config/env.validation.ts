import * as v from 'valibot';
import { EnvSchema } from './env.schema';

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = v.safeParse(EnvSchema, config);

  if (!result.success) {
    const errors = result.issues
      .map((issue) => {
        const path = issue.path?.map((p) => String(p.key)).join('.') || 'root';
        return `${path}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.output as Record<string, unknown>;
}
