import { Search as SearchIcon, X } from 'lucide-react';

export default function SearchInput({
  placeholder = 'Search...',
  value = '',
  onChange,
  style = {},
  className = '',
}) {
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div className={`search-input-wrapper ${className}`} style={{ position: 'relative', ...style }}>
      <SearchIcon
        size={16}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="input"
        style={{
          paddingLeft: '40px',
          paddingRight: value ? '40px' : '12px',
          width: '100%',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-muted)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
