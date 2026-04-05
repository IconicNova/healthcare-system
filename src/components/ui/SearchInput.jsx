'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
}) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      onSearch?.(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="topbar-search">
      <Search className="topbar-search-icon" />
      <input
        type="text"
        className="topbar-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: '250px' }}
      />
      {value && (
        <button
          onClick={() => {
            setValue('');
            onSearch?.('');
          }}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
