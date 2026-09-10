import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const normalized = (typeof children === 'string' ? children.toLowerCase() : variant).trim();

  const getStyle = () => {
    switch (normalized) {
      case 'completed':
      case 'active':
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'submitted':
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'late':
      case 'danger':
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'pending':
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'student':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (normalized) {
      case 'completed':
      case 'active':
      case 'success':
        return 'bg-emerald-500';
      case 'submitted':
      case 'info':
        return 'bg-blue-500';
      case 'late':
      case 'danger':
      case 'inactive':
        return 'bg-rose-500';
      case 'pending':
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${getStyle()} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {children}
    </span>
  );
};
