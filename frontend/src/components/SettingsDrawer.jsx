import { useEffect, useRef } from 'react'
import { Bot, FolderOpen, ShieldCheck, Wrench, X } from 'lucide-react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function normalizeProvider(provider) {
  if (typeof provider === 'string') return { value: provider, label: provider, defaultModel: '' }
  // 백엔드는 PROVIDERS 의 키(id)로 프로바이더를 찾는다. 표시명(name)을 value 로 쓰면
  // 저장된 값이 'Google Gemini' 가 되어 이후 모든 AI 호출이 Unknown provider 로 실패한다.
  return {
    value: provider?.id || provider?.value || '',
    label: provider?.name || provider?.label || provider?.id || '알 수 없음',
    defaultModel: provider?.defaultModel || '',
  }
}

export default function SettingsDrawer({ open, onClose, clinic }) {
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    previousFocusRef.current = document.activeElement
    const panel = panelRef.current
    panel?.querySelector(FOCUSABLE)?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((item) => !item.disabled)
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocusRef.current?.focus?.() }
  }, [onClose, open])

  if (!open) return null
  const providers = clinic.providers.length ? clinic.providers.map(normalizeProvider) : [{ value: 'gemini', label: 'Gemini' }, { value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }]
  return (
    <div className="drawer-backdrop is-open" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={panelRef} className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="panel-header"><div><p className="eyebrow">관제 설정</p><h2 id="settings-title">프로젝트 설정</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="설정 닫기" title="닫기"><X size={18} /></button></header>
        <section className="settings-section"><h3><FolderOpen size={16} />대상 프로젝트</h3><label>등록 프로젝트<select value={clinic.currentProjectDir} onChange={(event) => clinic.changeProject(event.target.value)}><option value="">프로젝트 선택</option>{clinic.projects.map((project) => <option key={project.path} value={project.path}>{project.name}</option>)}</select></label><label>직접 경로<input value={clinic.customPath} onChange={(event) => clinic.setCustomPath(event.target.value)} /></label><div className="button-row"><button className="button button-secondary" type="button" onClick={() => clinic.changeProject(clinic.customPath)}>경로 이동</button><button className="button button-secondary" type="button" onClick={clinic.openFolderBrowser}><FolderOpen size={15} />폴더 탐색</button></div><button className="button button-secondary full" type="button" onClick={clinic.initializeProject} disabled={clinic.busy.initialize}><Wrench size={15} />{clinic.busy.initialize ? '초기화 중…' : '진단 도구 초기화·보강'}</button></section>
        <section className="settings-section"><h3><Bot size={16} />내 AI 키 연결 <small>(BYOK)</small></h3><p className="settings-help">내가 가진 AI 서비스 키를 이 기기에서만 연결해 프로젝트 분석에 사용합니다.</p><label>AI 서비스<select value={clinic.byok.provider} onChange={(event) => clinic.setByok((current) => ({ ...current, provider: event.target.value }))}>{providers.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></label><label>API 키<input type="password" autoComplete="off" value={clinic.byok.apiKey} placeholder={clinic.hasSavedKey ? '저장된 키 유지 — 변경할 때만 입력' : 'API 키 입력'} onChange={(event) => clinic.setByok((current) => ({ ...current, apiKey: event.target.value }))} /></label><label>사용 모델<input value={clinic.byok.model} placeholder={providers.find((provider) => provider.value === clinic.byok.provider)?.defaultModel || '모델명 입력'} onChange={(event) => clinic.setByok((current) => ({ ...current, model: event.target.value }))} /></label>{clinic.byokFeedback && <p className={`feedback ${clinic.byokFeedback.type}`}>{clinic.byokFeedback.message}</p>}<button className="button button-primary full" type="button" onClick={clinic.saveByok}><ShieldCheck size={15} />연결 설정 저장</button></section>
      </aside>
    </div>
  )
}