import React from 'react';
import { clsx } from 'clsx';

interface ProviderLogoProps {
  provider: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  provider,
  className,
  size = 'md',
}) => {
  const normalized = (provider || '').toLowerCase().replace(/[\s_-]+/g, '');

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  // Microsoft 4-color square logo
  if (normalized.includes('microsoft') || normalized.includes('azure') || normalized === 'msft') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" rx="1" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" rx="1" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" rx="1" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" rx="1" />
      </svg>
    );
  }

  // AWS Smile & Text Logo
  if (normalized.includes('aws') || normalized.includes('amazon')) {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.4 12.8L5.2 6.5H7.1L8.5 11L9.9 6.5H11.7L9.5 12.8H7.4Z" fill="#FF9900" />
        <path d="M11.6 12.8L13.8 6.5H15.6L16.9 10.8L18.2 6.5H20L17.8 12.8H15.8L14.6 8.8L13.5 12.8H11.6Z" fill="#FF9900" />
        <path d="M4 17.5C9 20.8 16 20.5 20.5 16.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 14.5L21.2 16.2L18.5 17.8" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Google 4-color G Logo
  if (normalized.includes('google') || normalized === 'gcp') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h5.9c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.5-5 3.5-8.4z" fill="#4285F4" />
        <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.8c-1.1.7-2.5 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.3H1.1v2.9C3.1 19.9 7.2 23 12 23z" fill="#34A853" />
        <path d="M4.9 13.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V6H1.1C.4 7.4 0 9 0 11s.4 3.6 1.1 5l3.8-2.9z" fill="#FBBC05" />
        <path d="M12 4.6c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.2 0 3.1 3.1 1.1 7.1l3.8 2.9c1-3.1 3.8-5.4 7.1-5.4z" fill="#EA4335" />
      </svg>
    );
  }

  // Cisco Bridge/Bars Logo
  if (normalized.includes('cisco') || normalized === 'csco') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="10" width="2" height="6" rx="1" fill="#1BA0D7" />
        <rect x="6" y="6" width="2" height="10" rx="1" fill="#1BA0D7" />
        <rect x="11" y="2" width="2" height="14" rx="1" fill="#1BA0D7" />
        <rect x="16" y="6" width="2" height="10" rx="1" fill="#1BA0D7" />
        <rect x="20" y="10" width="2" height="6" rx="1" fill="#1BA0D7" />
      </svg>
    );
  }

  // CompTIA Red Shield / Stylized Logo
  if (normalized.includes('comptia')) {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="4" fill="#C8232C" />
        <path d="M16.5 8.5C15.5 7.5 13.8 7 12 7C9 7 7 9.2 7 12C7 14.8 9 17 12 17C13.8 17 15.5 16.5 16.5 15.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 9.5V14.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // PMI Hexagon / Project Logo
  if (normalized.includes('pmi')) {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="#E0234E" />
        <path d="M8 8H13C14.7 8 16 9.3 16 11C16 12.7 14.7 14 13 14H10.5V17H8V8Z" fill="#FFFFFF" />
        <rect x="10.5" y="10.2" width="3" height="2" rx="0.5" fill="#E0234E" />
      </svg>
    );
  }

  // IBM 8-Bar Logo
  if (normalized.includes('ibm')) {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="2" fill="#054ADA" />
        <rect x="2" y="7" width="20" height="2" fill="#054ADA" />
        <rect x="2" y="10" width="20" height="2" fill="#054ADA" />
        <rect x="2" y="13" width="20" height="2" fill="#054ADA" />
        <rect x="2" y="16" width="20" height="2" fill="#054ADA" />
        <rect x="2" y="19" width="20" height="2" fill="#054ADA" />
      </svg>
    );
  }

  // Oracle Red Pill Logo
  if (normalized.includes('oracle') || normalized === 'orcl') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="14" rx="7" fill="#F80000" />
        <rect x="6.5" y="8" width="11" height="8" rx="4" fill="#111118" />
      </svg>
    );
  }

  // Red Hat Fedora Shadowman Logo
  if (normalized.includes('redhat') || normalized.includes('red_hat')) {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 13.5C2.5 13.5 6 12 12 12C18 12 21.5 13.5 21.5 13.5C21.5 13.5 20 17 12 17C4 17 2.5 13.5 2.5 13.5Z" fill="#EE0000" />
        <path d="M7 12C7 8 9.5 5 12 5C14.5 5 17 8 17 12H7Z" fill="#EE0000" />
        <circle cx="12" cy="14" r="2.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // VMware Cube / Cloud Logo
  if (normalized.includes('vmware') || normalized === 'vmw') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="9" height="7" rx="1.5" fill="#728490" />
        <rect x="13" y="4" width="9" height="7" rx="1.5" fill="#4B6370" />
        <rect x="2" y="13" width="9" height="7" rx="1.5" fill="#4B6370" />
        <rect x="13" y="13" width="9" height="7" rx="1.5" fill="#728490" />
      </svg>
    );
  }

  // Salesforce Cloud Logo
  if (normalized.includes('salesforce') || normalized === 'sfdc') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.5 9.5C17.8 7.5 15.8 6 13.5 6C11.8 6 10.2 6.8 9.3 8.1C8.5 7.4 7.3 7 6 7C3.8 7 2 8.8 2 11C2 11.4 2.1 11.8 2.2 12.1C1.2 12.9 0.5 14.1 0.5 15.5C0.5 18 2.5 20 5 20H19C21.2 20 23 18.2 23 16C23 13.9 21.4 12.1 19.3 11.8C19.4 11.3 19.5 10.7 19.5 10.2C19.5 9.9 19.4 9.7 18.5 9.5Z" fill="#00A1E0" />
      </svg>
    );
  }

  // Linux Foundation / Kubernetes Wheel Logo
  if (normalized.includes('linux') || normalized.includes('kubernetes') || normalized === 'lf') {
    return (
      <svg className={clsx(sizeClasses, className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#003366" />
        <path d="M12 4V20M4 12H20M6.3 6.3L17.7 17.7M17.7 6.3L6.3 17.7" stroke="#326CE5" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Generic fallback badge
  return (
    <div className={clsx('flex items-center justify-center rounded-lg bg-brand-orange/15 font-bold text-brand-orange text-xs', sizeClasses, className)}>
      {provider.slice(0, 3).toUpperCase()}
    </div>
  );
};
