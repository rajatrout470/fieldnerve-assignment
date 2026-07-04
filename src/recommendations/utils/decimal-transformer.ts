import { ValueTransformer } from 'typeorm';

// Postgres NUMERIC/DECIMAL columns come back from the driver as strings;
// this keeps totalScore a `number` on the entity in both directions.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? null : parseFloat(value),
};
