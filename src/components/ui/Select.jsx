export default function Select({ label, options = [], error, className = '', ...props }) {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="label-field">{label}</label>}
      <select className={`input-field bg-white ${error ? 'border-red-400 ring-1 ring-red-300' : ''}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
