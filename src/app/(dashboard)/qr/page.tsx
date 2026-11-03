'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { QrCode, Link2, Upload, Download, Printer, Copy, Check, X, RefreshCw, Trash2, History, ChevronDown, ChevronUp, FileText, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'

type InputMode = 'url' | 'text' | 'file'
type QRSize = 256 | 512 | 1024

interface QRRecord {
  id: string
  created_at: string
  label: string | null
  content: string
  mode: string
  data_url: string | null
  size: number
  fg_color: string
  bg_color: string
}

const QR_SIZES: { label: string; value: QRSize }[] = [
  { label: 'เล็ก (256px)', value: 256 },
  { label: 'กลาง (512px)', value: 512 },
  { label: 'ใหญ่ (1024px)', value: 1024 },
]

const ERROR_LEVELS = [
  { label: 'L — 7%', value: 'L' as const },
  { label: 'M — 15%', value: 'M' as const },
  { label: 'Q — 25%', value: 'Q' as const },
  { label: 'H — 30%', value: 'H' as const },
]

const MODE_CONFIG = {
  url:  { icon: Link2,     label: 'URL / ลิงก์',  color: 'blue'   },
  text: { icon: FileText,  label: 'ข้อความ',       color: 'violet' },
  file: { icon: Upload,    label: 'อัปโหลดไฟล์',   color: 'emerald' },
}

export default function QRGeneratorPage() {
  const [mode, setMode] = useState<InputMode>('url')
  const [inputValue, setInputValue] = useState('')
  const [label, setLabel] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrContent, setQrContent] = useState('')
  const [size, setSize] = useState<QRSize>(512)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [fgColor, setFgColor] = useState('#1e293b')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [history, setHistory] = useState<QRRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false }).limit(50)
    setHistory(data ?? [])
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const saveToHistory = async (content: string, dataUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('qr_codes').insert({
      created_by: user?.id, label: label.trim() || null,
      content, mode, data_url: dataUrl, size, fg_color: fgColor, bg_color: bgColor,
    })
    loadHistory()
  }

  const generateQR = useCallback(async (content: string) => {
    if (!content.trim()) return
    setGenerating(true); setError('')
    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size, margin: 2, errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      })
      setQrDataUrl(dataUrl); setQrContent(content)
      await saveToHistory(content, dataUrl)
    } catch { setError('เกิดข้อผิดพลาดในการสร้าง QR Code ค่ะ') }
    finally { setGenerating(false) }
  }, [size, errorLevel, fgColor, bgColor, label, mode])

  const handleGenerate = () => {
    const content = mode === 'file' ? uploadedUrl : inputValue
    if (!content.trim()) { setError(mode === 'file' ? 'กรุณาอัปโหลดไฟล์ก่อนค่ะ' : 'กรุณากรอก URL หรือข้อความค่ะ'); return }
    generateQR(content)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setError('ไฟล์ต้องมีขนาดไม่เกิน 50MB ค่ะ'); return }
    setUploading(true); setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `qr-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('factory-files').upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('factory-files').getPublicUrl(path)
      setUploadedUrl(data.publicUrl)
      if (!label) setLabel(file.name)
    } catch (err: any) { setError(`อัปโหลดไม่สำเร็จ: ${err.message ?? 'ลองใหม่อีกครั้งค่ะ'}`) }
    finally { setUploading(false) }
  }

  const handleDownload = async (format: 'png' | 'svg', content?: string, dataUrl?: string) => {
    const c = content ?? qrContent; const d = dataUrl ?? qrDataUrl
    if (!c) return
    if (format === 'png' && d) {
      const a = document.createElement('a'); a.href = d; a.download = `qrcode-${Date.now()}.png`; a.click()
    } else {
      const svg = await QRCode.toString(c, { type: 'svg', width: size, margin: 2, errorCorrectionLevel: errorLevel, color: { dark: fgColor, light: bgColor } })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `qrcode-${Date.now()}.svg`; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handlePrint = (content?: string, dataUrl?: string) => {
    const c = content ?? qrContent; const d = dataUrl ?? qrDataUrl
    if (!d) return
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>QR Code — ${c}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;font-family:system-ui,sans-serif;gap:16px}.card{background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;gap:12px}img{width:280px;height:280px}p{color:#64748b;font-size:11px;max-width:280px;text-align:center;word-break:break-all;line-height:1.5}h3{color:#1e293b;font-size:14px;font-weight:600}button{margin-top:8px;background:#1e293b;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer}@media print{button{display:none}body{background:white}.card{box-shadow:none}}</style></head><body><div class="card"><img src="${d}" alt="QR Code"/><h3>${c}</h3></div><button onclick="window.print()">🖨️ พิมพ์</button></body></html>`)
    w.document.close(); setTimeout(() => w.print(), 500)
  }

  const handleCopy = async (text?: string) => {
    await navigator.clipboard.writeText(text ?? qrContent)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('qr_codes').delete().eq('id', id)
    setHistory(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
  }

  const handleLoadFromHistory = (record: QRRecord) => {
    setQrDataUrl(record.data_url); setQrContent(record.content)
    setLabel(record.label ?? ''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setQrDataUrl(null); setQrContent(''); setInputValue('')
    setUploadedUrl(''); setError(''); setLabel('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white'

  const modeBadgeClass = (m: InputMode) => mode === m
    ? 'bg-slate-900 text-white shadow-sm'
    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <QrCode size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">QR Code Generator</h1>
              <p className="text-slate-400 text-sm">สร้าง QR Code จาก URL, ข้อความ หรือไฟล์</p>
            </div>
          </div>
          {history.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <History size={13} />
              <span>{history.length} รายการในประวัติ</span>
            </div>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left — Input (3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Card: Mode + Input */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ประเภทข้อมูล</p>
                <div className="flex gap-2">
                  {(Object.entries(MODE_CONFIG) as [InputMode, typeof MODE_CONFIG.url][]).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={key} onClick={() => { setMode(key); handleReset() }}
                        className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${modeBadgeClass(key)}`}>
                        <Icon size={14} />{cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Label */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">ชื่อ / รายละเอียด <span className="text-slate-300">(ไม่บังคับ)</span></label>
                  <input type="text" value={label} onChange={e => setLabel(e.target.value)}
                    placeholder="เช่น TREX-2026-001, แค็ตตาล็อก Q4" className={inputClass} />
                </div>

                {/* URL */}
                {mode === 'url' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">URL</label>
                    <div className="relative">
                      <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="url" value={inputValue} onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                        placeholder="https://narathonggroup.com" className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                )}

                {/* Text */}
                {mode === 'text' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">ข้อความ / Serial / Batch</label>
                    <textarea value={inputValue} onChange={e => setInputValue(e.target.value)}
                      placeholder="เช่น TREX-2026-001, Serial Number, ข้อความที่ต้องการ"
                      rows={3} className={`${inputClass} resize-none`} />
                  </div>
                )}

                {/* File */}
                {mode === 'file' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">อัปโหลดไฟล์</label>
                    <div onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none ${uploadedUrl ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'}`}>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-blue-600 text-sm font-medium">กำลังอัปโหลด...</p>
                        </div>
                      ) : uploadedUrl ? (
                        <div>
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Check size={20} className="text-emerald-600" />
                          </div>
                          <p className="text-emerald-700 text-sm font-semibold">อัปโหลดสำเร็จ!</p>
                          <p className="text-slate-400 text-xs mt-1 truncate max-w-xs mx-auto">{uploadedUrl}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Upload size={18} className="text-slate-400" />
                          </div>
                          <p className="text-slate-600 text-sm font-medium">คลิกหรือลากไฟล์มาวาง</p>
                          <p className="text-slate-400 text-xs mt-1">รองรับทุกประเภทไฟล์ ขนาดสูงสุด 50MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card: Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">ตั้งค่า QR Code</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">ขนาด</label>
                  <select value={size} onChange={e => setSize(Number(e.target.value) as QRSize)} className={inputClass}>
                    {QR_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Error Correction</label>
                  <select value={errorLevel} onChange={e => setErrorLevel(e.target.value as any)} className={inputClass}>
                    {ERROR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">สี QR (Dark)</label>
                  <div className="flex gap-2">
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 flex-shrink-0 p-0.5" />
                    <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className={`${inputClass} flex-1 font-mono`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">สีพื้นหลัง (Light)</label>
                  <div className="flex gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 flex-shrink-0 p-0.5" />
                    <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className={`${inputClass} flex-1 font-mono`} />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <X size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button onClick={handleGenerate} disabled={generating}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/20">
              {generating
                ? <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />กำลังสร้าง QR Code...</>
                : <><Sparkles size={18} />สร้าง QR Code</>}
            </button>
          </div>

          {/* Right — Preview (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ตัวอย่าง QR Code</p>
              </div>

              {qrDataUrl ? (
                <div className="p-5 flex flex-col items-center gap-4">
                  {/* QR */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                    <img src={qrDataUrl} alt="QR Code" className="block rounded-lg" style={{ width: 200, height: 200 }} />
                  </div>

                  {/* Info */}
                  <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {label && <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>}
                    <p className="text-xs text-slate-400 break-all mt-0.5 leading-relaxed">{qrContent}</p>
                  </div>

                  {/* Actions */}
                  <div className="w-full space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleDownload('png')}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                        <Download size={14} />PNG
                      </button>
                      <button onClick={() => handleDownload('svg')}
                        className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                        <Download size={14} />SVG
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handlePrint()}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                        <Printer size={14} />พิมพ์
                      </button>
                      <button onClick={() => handleCopy()}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                        {copied ? <><Check size={14} />คัดลอกแล้ว!</> : <><Copy size={14} />Copy URL</>}
                      </button>
                    </div>
                    <button onClick={handleReset}
                      className="w-full flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-medium transition-all">
                      <RefreshCw size={14} />สร้างใหม่
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                    <QrCode size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">กรอกข้อมูลแล้วกดปุ่มสร้าง QR Code ค่ะ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── History ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <History size={16} className="text-slate-600" />
              <span className="font-semibold text-slate-800 text-sm">ประวัติ QR Code</span>
              {history.length > 0 && (
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{history.length}</span>
              )}
            </div>
            {showHistory ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {showHistory && (
            <div className="border-t border-slate-100">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                    <QrCode size={22} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">ยังไม่มีประวัติ QR Code ค่ะ</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {history.map(record => (
                    <div key={record.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                      {/* Thumbnail */}
                      <div onClick={() => handleLoadFromHistory(record)}
                        className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-white cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                        {record.data_url
                          ? <img src={record.data_url} alt="QR" className="w-full h-full object-contain" />
                          : <div className="w-full h-full flex items-center justify-center"><QrCode size={20} className="text-slate-300" /></div>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadFromHistory(record)}>
                        <p className="text-sm font-medium text-slate-800 truncate">{record.label || record.content}</p>
                        {record.label && <p className="text-xs text-slate-400 truncate">{record.content}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${record.mode === 'url' ? 'bg-blue-50 text-blue-600' : record.mode === 'file' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}>
                            {record.mode === 'url' ? '🔗' : record.mode === 'file' ? '📁' : '📝'} {record.mode}
                          </span>
                          <span className="text-xs text-slate-300">{formatDate(record.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownload('png', record.content, record.data_url ?? undefined)} title="Download PNG"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handlePrint(record.content, record.data_url ?? undefined)} title="พิมพ์"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleCopy(record.content)} title="Copy"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleDelete(record.id)} disabled={deletingId === record.id} title="ลบ"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50">
                          {deletingId === record.id
                            ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
