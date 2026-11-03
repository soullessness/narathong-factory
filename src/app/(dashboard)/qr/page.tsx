'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { QrCode, Link, Upload, Download, Printer, Copy, Check, X, RefreshCw, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function QRGeneratorPage() {
  const [mode, setMode] = useState<InputMode>('url')
  const [inputValue, setInputValue] = useState('')
  const [label, setLabel] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrContent, setQrContent] = useState('')
  const [size, setSize] = useState<QRSize>(512)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [fgColor, setFgColor] = useState('#000000')
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
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setHistory(data ?? [])
    setHistoryLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const saveToHistory = async (content: string, dataUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('qr_codes').insert({
      created_by: user?.id,
      label: label.trim() || null,
      content,
      mode,
      data_url: dataUrl,
      size,
      fg_color: fgColor,
      bg_color: bgColor,
    })
    loadHistory()
  }

  const generateQR = useCallback(async (content: string) => {
    if (!content.trim()) return
    setGenerating(true)
    setError('')
    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      })
      setQrDataUrl(dataUrl)
      setQrContent(content)
      await saveToHistory(content, dataUrl)
    } catch {
      setError('เกิดข้อผิดพลาดในการสร้าง QR Code ค่ะ')
    } finally {
      setGenerating(false)
    }
  }, [size, errorLevel, fgColor, bgColor, label, mode])

  const handleGenerate = () => {
    const content = mode === 'file' ? uploadedUrl : inputValue
    if (!content.trim()) {
      setError(mode === 'file' ? 'กรุณาอัปโหลดไฟล์ก่อนค่ะ' : 'กรุณากรอก URL หรือข้อความค่ะ')
      return
    }
    generateQR(content)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setError('ไฟล์ต้องมีขนาดไม่เกิน 50MB ค่ะ'); return }
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `qr-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('factory-files').upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('factory-files').getPublicUrl(path)
      setUploadedUrl(data.publicUrl)
      if (!label) setLabel(file.name)
    } catch (err: any) {
      setError(`อัปโหลดไม่สำเร็จ: ${err.message ?? 'ลองใหม่อีกครั้งค่ะ'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (format: 'png' | 'svg', content?: string, dataUrl?: string) => {
    const dl_content = content ?? qrContent
    const dl_dataUrl = dataUrl ?? qrDataUrl
    if (!dl_content) return
    if (format === 'png' && dl_dataUrl) {
      const a = document.createElement('a')
      a.href = dl_dataUrl
      a.download = `qrcode-${Date.now()}.png`
      a.click()
    } else {
      const svg = await QRCode.toString(dl_content, { type: 'svg', width: size, margin: 2, errorCorrectionLevel: errorLevel, color: { dark: fgColor, light: bgColor } })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${Date.now()}.svg`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handlePrint = (content?: string, dataUrl?: string) => {
    const p_content = content ?? qrContent
    const p_dataUrl = dataUrl ?? qrDataUrl
    if (!p_dataUrl) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>QR Code</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}img{max-width:80vw;max-height:80vh}p{color:#666;font-size:12px;margin-top:8px;word-break:break-all;max-width:80vw;text-align:center}@media print{button{display:none}}</style></head><body><img src="${p_dataUrl}" alt="QR Code"/><p>${p_content}</p><br/><button onclick="window.print()">🖨️ พิมพ์</button></body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const handleCopy = async (text?: string) => {
    await navigator.clipboard.writeText(text ?? qrContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('qr_codes').delete().eq('id', id)
    setHistory(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
  }

  const handleLoadFromHistory = (record: QRRecord) => {
    setQrDataUrl(record.data_url)
    setQrContent(record.content)
    setLabel(record.label ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setQrDataUrl(null); setQrContent(''); setInputValue('')
    setUploadedUrl(''); setError(''); setLabel('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all'

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <QrCode size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">QR Code Generator</h1>
          <p className="text-gray-500 text-sm">สร้าง QR Code จาก URL, ข้อความ หรือไฟล์</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">ประเภทข้อมูล</h2>

            {/* Mode Tabs */}
            <div className="flex gap-2">
              {[{ key: 'url', label: '🔗 URL' }, { key: 'text', label: '📝 ข้อความ' }, { key: 'file', label: '📁 ไฟล์' }].map(tab => (
                <button key={tab.key} onClick={() => { setMode(tab.key as InputMode); handleReset() }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ/รายละเอียด (ไม่บังคับ)</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="เช่น สินค้า TREX-001, แค็ตตาล็อก Q4" className={inputClass} />
            </div>

            {/* Input by mode */}
            {mode === 'url' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                <div className="relative">
                  <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" value={inputValue} onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    placeholder="https://narathonggroup.com" className={`${inputClass} pl-9`} />
                </div>
              </div>
            )}

            {mode === 'text' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ข้อความ / Serial / Batch</label>
                <textarea value={inputValue} onChange={e => setInputValue(e.target.value)}
                  placeholder="เช่น TREX-2026-001" rows={3} className={`${inputClass} resize-none`} />
              </div>
            )}

            {mode === 'file' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">อัปโหลดไฟล์</label>
                <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${uploadedUrl ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-blue-600 text-sm">กำลังอัปโหลด...</p>
                    </div>
                  ) : uploadedUrl ? (
                    <div>
                      <Check size={26} className="text-green-500 mx-auto mb-1" />
                      <p className="text-green-700 text-sm font-medium">อัปโหลดสำเร็จ!</p>
                      <p className="text-gray-400 text-xs mt-1 truncate max-w-full">{uploadedUrl}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={26} className="text-gray-400 mx-auto mb-1" />
                      <p className="text-gray-600 text-sm font-medium">คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-gray-400 text-xs">รองรับทุกประเภท ไม่เกิน 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">ตั้งค่า QR Code</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ขนาด</label>
                <select value={size} onChange={e => setSize(Number(e.target.value) as QRSize)} className={inputClass}>
                  {QR_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Error Correction</label>
                <select value={errorLevel} onChange={e => setErrorLevel(e.target.value as any)} className={inputClass}>
                  {ERROR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">สี QR</label>
                <div className="flex gap-2">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" />
                  <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">สีพื้นหลัง</label>
                <div className="flex gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <X size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
            {generating ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังสร้าง...</> : <><QrCode size={20} />สร้าง QR Code</>}
          </button>
        </div>

        {/* Right — Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">ตัวอย่าง QR Code</h2>
            </div>
            {qrDataUrl ? (
              <div className="p-5 flex flex-col items-center gap-4">
                <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
                  <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220 }} />
                </div>
                {(label || qrContent) && (
                  <div className="w-full bg-gray-50 rounded-xl p-3">
                    {label && <p className="text-sm font-medium text-gray-800">{label}</p>}
                    <p className="text-xs text-gray-500 break-all mt-0.5">{qrContent}</p>
                  </div>
                )}
                <div className="w-full space-y-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload('png')} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                      <Download size={15} />PNG
                    </button>
                    <button onClick={() => handleDownload('svg')} className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                      <Download size={15} />SVG
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePrint()} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                      <Printer size={15} />พิมพ์
                    </button>
                    <button onClick={() => handleCopy()} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'คัดลอกแล้ว!' : 'Copy URL'}
                    </button>
                  </div>
                  <button onClick={handleReset} className="w-full flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <RefreshCw size={15} />สร้างใหม่
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <QrCode size={52} className="mb-3 opacity-20" />
                <p className="text-sm">กรอกข้อมูลแล้วกด "สร้าง QR Code"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-all">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">ประวัติ QR Code</h2>
            {history.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{history.length}</span>}
          </div>
          {showHistory ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {showHistory && (
          <div className="border-t border-gray-100">
            {historyLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <QrCode size={36} className="mb-2 opacity-20" />
                <p className="text-sm">ยังไม่มีประวัติ QR Code ค่ะ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(record => (
                  <div key={record.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all">
                    {/* QR thumbnail */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-100 bg-white cursor-pointer" onClick={() => handleLoadFromHistory(record)}>
                      {record.data_url
                        ? <img src={record.data_url} alt="QR" className="w-full h-full object-contain" />
                        : <div className="w-full h-full flex items-center justify-center"><QrCode size={24} className="text-gray-300" /></div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadFromHistory(record)}>
                      <p className="text-sm font-medium text-gray-800 truncate">{record.label || record.content}</p>
                      {record.label && <p className="text-xs text-gray-400 truncate">{record.content}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${record.mode === 'url' ? 'bg-blue-50 text-blue-600' : record.mode === 'file' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                          {record.mode === 'url' ? '🔗 URL' : record.mode === 'file' ? '📁 ไฟล์' : '📝 Text'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(record.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleDownload('png', record.content, record.data_url ?? undefined)} title="Download PNG"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all">
                        <Download size={15} />
                      </button>
                      <button onClick={() => handlePrint(record.content, record.data_url ?? undefined)} title="พิมพ์"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                        <Printer size={15} />
                      </button>
                      <button onClick={() => handleCopy(record.content)} title="Copy"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                        <Copy size={15} />
                      </button>
                      <button onClick={() => handleDelete(record.id)} disabled={deletingId === record.id} title="ลบ"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50">
                        {deletingId === record.id ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={15} />}
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
  )
}
