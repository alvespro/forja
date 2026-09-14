/**
 * Cálculos clínicos (HOMA-IR, ratios lipídicos, zonas de FC, recuperação,
 * recomposição). O código vive em supabase/functions/_shared para que a Edge
 * Function health-calc e o app usem exatamente as mesmas fórmulas e faixas.
 */
export * from '../../supabase/functions/_shared/health-calc.ts'
