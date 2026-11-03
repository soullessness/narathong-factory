'use client'

import { useState, useRef, useCallback } from 'react'
import { QrCode, Link, Upload, Download, Printer, Copy, Check, X, RefreshCw } from 'lucide-react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'

type InputMode = 'url' | 'text' | 'file'
type QRSize = 256 | 512 | 1024

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้าง QR Code ค่ะ')
    } finally {
      setGenerating(false)
    }
  }, [size, errorLevel, fgColor, bgColor])

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
    if (file.size > 50 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 50MB ค่ะ')
      return
    }
    setUploading(true)
    setError('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `qr-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('factory-files')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('factory-files').getPublicUrl(path)
      setUploadedUrl(data.publicUrl)
    } catch (err: any) {
      setError(`อัปโหลดไม่สำเร็จ: ${err.message ?? 'ลองใหม่อีกครั้งค่ะ'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (format: 'png' | 'svg') => {
    if (!qrDataUrl || !qrContent) return
    if (format === 'png') {
      const a = document.createElement('a')
      a.href = qrDataUrl
      a.download = `qrcode-${Date.now()}.png`
      a.click()
    } else {
      // Generate SVG
      QRCode.toString(qrContent, {
        type: 'svg',
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      }).then(svg => {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qrcode-${Date.now()}.svg`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  const handlePrint = () => {
    if (!qrDataUrl) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            img { max-width: 80vw; max-height: 80vh; }
            p { color: #666; font-size: 12px; margin-top: 8px; word-break: break-all; max-width: 80vw; text-align: center; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" alt="QR Code" />
          <p>${qrContent}</p>
          <br/>
          <button onclick="window.print()">🖨️ พิมพ์</button>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const handleCopy = async () => {
    if (!qrContent) return
    await navigator.clipboard.writeText(qrContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setQrDataUrl(null)
    setQrContent('')
    setInputValue('')
    setUploadedUrl('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <QrCode size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">QR Code Generator</h1>
            <p className="text-gray-500 text-sm">สร้าง QR Code จาก URL, ข้อความ หรือไฟล์</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="space-y-5">
          {/* Mode Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">ประเภทข้อมูล</h2>
            <div className="flex gap-2 mb-4">
              {[
                { key: 'url', label: '🔗 URL', desc: 'ลิงก์เว็บ' },
                { key: 'text', label: '📝 ข้อความ', desc: 'Text' },
                { key: 'file', label: '📁 ไฟล์', desc: 'Upload' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setMode(tab.key as InputMode); handleReset() }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    mode === tab.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            {mode === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                      placeholder="https://narathonggroup.com"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อความ / Serial / Batch</label>
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="เช่น TREX-2026-001, ชื่อสินค้า, Serial Number"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}

            {mode === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">อัปโหลดไฟล์</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    uploadedUrl ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-blue-600 text-sm">กำลังอัปโหลด...</p>
                    </div>
                  ) : uploadedUrl ? (
                    <div>
                      <Check size={28} className="text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 text-sm font-medium">อัปโหลดสำเร็จ!</p>
                      <p className="text-gray-400 text-xs mt-1 truncate">{uploadedUrl}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm font-medium">คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-gray-400 text-xs mt-1">รองรับทุกประเภทไฟล์ ไม่เกิน 50MB</p>
                    </div>
                  )}
                </div>
                {uploadedUrl && (
                  <div className="mt-2">
                    <input value={uploadedUrl} readOnly className={`${inputClass} bg-gray-50 text-xs`} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">ตั้งค่า QR Code</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">ขนาด</label>
                <select value={size} onChange={e => setSize(Number(e.target.value) as QRSize)} className={inputClass}>
                  {QR_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Error Correction</label>
                <select value={errorLevel} onChange={e => setErrorLevel(e.target.value as any)} className={inputClass}>
                  {ERROR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">สี QR (Dark)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                  <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">สีพื้นหลัง (Light)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <X size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง QR Code...
              </>
            ) : (
              <>
                <QrCode size={20} />
                สร้าง QR Code
              </>
            )}
          </button>
        </div>

        {/* Right — Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">ตัวอย่าง QR Code</h2>
            </div>

            {qrDataUrl ? (
              <div className="p-6 flex flex-col items-center gap-5">
                {/* QR Preview */}
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                  <img src={qrDataUrl} alt="QR Code" className="block" style={{ width: 240, height: 240 }} />
                </div>

                {/* Content */}
                <div className="w-full bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">เนื้อหา QR:</p>
                  <p className="text-sm text-gray-800 break-all">{qrContent}</p>
                </div>

                {/* Actions */}
                <div className="w-full space-y-2">
                  {/* Download */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('png')}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                      <Download size={16} />
                      Download PNG
                    </button>
                    <button
                      onClick={() => handleDownload('svg')}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                      <Download size={16} />
                      Download SVG
                    </button>
                  </div>

                  {/* Print & Copy */}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                      <Printer size={16} />
                      พิมพ์
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        copied ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'คัดลอกแล้ว!' : 'คัดลอก URL'}
                    </button>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    <RefreshCw size={16} />
                    สร้างใหม่
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <QrCode size={56} className="mb-3 opacity-30" />
                <p className="text-sm">กรอกข้อมูลแล้วกด "สร้าง QR Code"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
