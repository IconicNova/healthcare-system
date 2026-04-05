export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-primary)',
        backgroundImage: `
          linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)
        `,
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
        {children}
      </div>
    </div>
  );
}
