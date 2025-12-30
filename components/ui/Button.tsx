import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  
  const variants = {
    primary: "bg-emerald-400 text-white hover:bg-emerald-500 focus:ring-emerald-300 shadow-md shadow-emerald-100 border border-transparent",
    secondary: "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-emerald-200 focus:ring-emerald-200 shadow-sm",
    danger: "bg-rose-400 text-white hover:bg-rose-500 focus:ring-rose-300 shadow-sm",
    ghost: "bg-transparent text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 focus:ring-emerald-200",
    outline: "bg-transparent border-2 border-emerald-400 text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-300",
  };

  const sizes = {
    sm: "h-8 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};