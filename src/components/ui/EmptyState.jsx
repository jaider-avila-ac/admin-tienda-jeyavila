import { PackageOpen } from 'lucide-react'

export default function EmptyState({ title = 'Sin resultados', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mb-4">
        <PackageOpen size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
