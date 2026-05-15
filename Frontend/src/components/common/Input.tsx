import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  as?: 'input' | 'textarea' | 'select';
}

const Input = ({ label, error, leftIcon, as = 'input', className = '', ...props }: InputProps) => {
  const Component = as as any;
  
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <div style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: as === 'textarea' ? '1rem' : '50%', 
            transform: as === 'textarea' ? 'none' : 'translateY(-50%)',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 10
          }}>
            {leftIcon}
          </div>
        )}
        <Component
          className={`${error ? 'input-error' : ''}`}
          style={{ 
            paddingLeft: leftIcon ? '3rem' : '1rem',
            ...(as === 'textarea' ? { minHeight: '120px' } : {})
          }}
          {...props}
        />
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default Input;
