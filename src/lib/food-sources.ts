/**
 * Multi-banco de alimentos (TACO → Open Food Facts → USDA → IA): tipos, badges
 * e conversões. O código vive em supabase/functions/_shared para que a Edge
 * Function search-food e o app usem exatamente as mesmas regras.
 */
export * from '../../supabase/functions/_shared/foods.ts'
