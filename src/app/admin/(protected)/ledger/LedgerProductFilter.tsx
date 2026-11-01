'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MultiSelectProductFilter, { ProductFilterItem } from '../MultiSelectProductFilter';

export default function LedgerProductFilter({ products }: { products: ProductFilterItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const productsParam = searchParams.get('products') || '';
  const selectedIds = productsParam ? productsParam.split(',').filter(Boolean) : [];

  const handleChange = (newIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length > 0) {
      params.set('products', newIds.join(','));
    } else {
      params.delete('products');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full sm:w-auto shrink-0">
      <MultiSelectProductFilter
        products={products}
        selectedIds={selectedIds}
        onChange={handleChange}
        alignRight
      />
    </div>
  );
}
