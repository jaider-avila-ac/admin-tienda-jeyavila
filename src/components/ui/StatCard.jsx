import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, to }) {
  const isPositive = trend >= 0

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-black text-black mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon size={20} className="text-icon-mono flex-shrink-0" />}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
          {isPositive ? (
            <TrendingUp size={14} className="text-admin-accent" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-xs font-semibold ${isPositive ? 'text-admin-accent' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
        </div>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="stat-card block transition-shadow hover:shadow-md">
        {content}
      </Link>
    )
  }

  return <div className="stat-card">{content}</div>
}
