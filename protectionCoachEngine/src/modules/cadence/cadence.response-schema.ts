import { toJSONSchema } from 'zod';
import { cadenceOutputSchema } from './cadence.schema';

export function getCadenceResponseJsonSchema(): unknown {
  const schema = toJSONSchema(cadenceOutputSchema) as Record<string, unknown>;
  const { $schema: _draftDeclaration, ...geminiCompatibleSchema } = schema;
  return geminiCompatibleSchema;
}
