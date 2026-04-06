import type { StatMetric } from '../types'
import AnimatedNumber from './AnimatedNumber'

interface StatCardProps {
  metric: StatMetric
}

export default function StatCard({ metric }: StatCardProps) {
  return (
    <article className="panel-card stat-card">
      <p className="panel-label">{metric.label}</p>
      <p className="stat-card-value mono-value">
        <AnimatedNumber
          value={metric.value}
          decimals={metric.decimals}
          prefix={metric.prefix}
          suffix={metric.suffix}
        />
      </p>
      {metric.delta ? <p className="panel-subtle">{metric.delta}</p> : null}
    </article>
  )
}
