/**
 * Utilidades para la Jerarquía de Productos en KsaSport.
 * Permite manejar la relación entre Torneos Principales (Padre con requires_opt_in)
 * y Cuotas/Jornadas Semanales Derivadas (Hijas).
 */

export interface BaseProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  categories?: string[] | null;
  requires_opt_in?: boolean | null;
  parent_product_id?: string | null;
}

/**
 * Encuentra el producto padre si un producto se deriva de un torneo/liga principal.
 * 1. Por relación explícita `parent_product_id`.
 * 2. Por tag `[parent_product_id: UUID]` en la descripción.
 * 3. Por similitud de nombre (prefijo): Si el nombre del producto comienza con el nombre
 *    de un torneo que tenga `requires_opt_in = true` (ej: "LIGA CLAUSURA 2026 semana 2" deriva de "LIGA CLAUSURA 2026").
 */
export function findParentProduct<T extends BaseProduct>(
  product: T,
  allProducts: T[]
): T | null {
  if (!product || !allProducts || allProducts.length === 0) return null;

  // 1. Verificación por parent_product_id explícito
  if (product.parent_product_id) {
    const parent = allProducts.find((p) => p.id === product.parent_product_id);
    if (parent && parent.id !== product.id) return parent;
  }

  // 2. Verificación por tag en description
  if (product.description) {
    const match = product.description.match(/\[parent_product_id:\s*([a-f0-9\-]+)\]/i);
    if (match && match[1]) {
      const parent = allProducts.find((p) => p.id === match[1]);
      if (parent && parent.id !== product.id) return parent;
    }
  }

  // 3. Fallback inteligente por prefijo de nombre
  const prodNameNorm = product.name.trim().toLowerCase();
  
  // Ordenamos los candidatos por longitud de nombre descendente para mayor precisión
  const candidates = allProducts
    .filter((p) => p.id !== product.id && Boolean(p.requires_opt_in))
    .sort((a, b) => b.name.length - a.name.length);

  for (const candidate of candidates) {
    const candidateNameNorm = candidate.name.trim().toLowerCase();
    
    // Si el nombre del producto empieza con el nombre del candidato y es más largo o contiene sufijos de semana/jornada
    if (
      prodNameNorm.startsWith(candidateNameNorm) &&
      prodNameNorm.length > candidateNameNorm.length
    ) {
      return candidate;
    }
  }

  return null;
}

/**
 * Devuelve el ID del producto que almacena las confirmaciones (opt-ins).
 * Si el producto tiene requires_opt_in directo, retorna su propio ID.
 * Si deriva de un padre con requires_opt_in, retorna el ID del padre.
 * Si no requiere opt-in, retorna null.
 */
export function getEffectiveOptInProductId<T extends BaseProduct>(
  product: T,
  allProducts: T[]
): string | null {
  if (product.requires_opt_in) {
    return product.id;
  }

  const parent = findParentProduct(product, allProducts);
  if (parent && parent.requires_opt_in) {
    return parent.id;
  }

  return null;
}

/**
 * Determina si un producto requiere confirmación de participación (directamente o por derivación).
 */
export function isProductOptInRequired<T extends BaseProduct>(
  product: T,
  allProducts: T[]
): boolean {
  return getEffectiveOptInProductId(product, allProducts) !== null;
}
