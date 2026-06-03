/**
 * Loader Component
 * 
 * A simple spinning loader for loading states.
 */
const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader-container">
      <div style={{ textAlign: 'center' }}>
        <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loader;
