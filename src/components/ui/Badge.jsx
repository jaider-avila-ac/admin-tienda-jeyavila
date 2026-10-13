const VARIANTS = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-admin-accent text-admin-accent-contrast',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-violet-100 text-violet-800',
  dark: 'bg-black text-white',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
