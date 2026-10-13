export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="label-field">{label}</label>}
      <input className={`input-field ${error ? 'border-red-400 ring-1 ring-red-300' : ''}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
