import { createContext, useContext, useState, type ReactNode } from 'react';

type GlobalFilter = 'all' | 'wp' | 'api';

interface FilterContextValue {
  filter: GlobalFilter;
  setFilter: (f: GlobalFilter) => void;
}

const FilterContext = createContext<FilterContextValue>({
  filter: 'all',
  setFilter: () => {},
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<GlobalFilter>('wp');
  return (
    <FilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useGlobalFilter() {
  return useContext(FilterContext);
}

export type { GlobalFilter };
