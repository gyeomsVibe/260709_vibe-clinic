import { ChevronRight } from 'lucide-react'

export default function DiagnosticCard({ diagnostic, result, selected, onSelect }) {
  const status = result?.status || 'PENDING'
  return (
    <button type="button" className={`diagnostic-card diagnostic-${status.toLowerCase()} ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
      <span className="diagnostic-state" aria-hidden="true" />
      <span className="diagnostic-main"><strong>{diagnostic.name || diagnostic.id}</strong><small>{diagnostic.id}</small></span>
      {/* linkedTask 는 진단이 어느 작업을 지키는지 알려주는 단서라 카드에서 바로 보이게 한다. */}
      <span className="diagnostic-meta"><em>{diagnostic.layer || 'TASK'}</em>{diagnostic.linkedTask && <small className="diagnostic-task">🔗 {diagnostic.linkedTask}</small>}{result?.confidence && <small>{result.confidence}</small>}</span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  )
}