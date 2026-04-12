'use client'

import dynamic from 'next/dynamic'
import { Quotation } from '@/types/quotation'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye } from 'lucide-react'
import { useState } from 'react'

// Dynamically import PDF components (no SSR)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
)

const QuotationPDFComponent = dynamic(
  () => import('./QuotationPDF').then((mod) => mod.QuotationPDF),
  { ssr: false }
)

interface PDFActionsProps {
  quotation: Quotation
}

export function PDFActions({ quotation }: PDFActionsProps) {
  const [showPreview, setShowPreview] = useState(false)

  const fileName = `${quotation.quotation_number || 'quotation'}.pdf`

  return (
    <div className="flex flex-col gap-2">
      {/* Preview toggle */}
      <Button
        variant="outline"
        onClick={() => setShowPreview(!showPreview)}
        className="gap-2"
      >
        <Eye className="w-4 h-4" />
        {showPreview ? 'ซ่อน PDF' : 'Preview PDF'}
      </Button>

      {/* Download */}
      <PDFDownloadLink
        document={<QuotationPDFComponent quotation={quotation} />}
        fileName={fileName}
      >
        {({ loading }) => (
          <Button
            disabled={loading}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white gap-2 w-full"
          >
            <Download className="w-4 h-4" />
            {loading ? 'กำลังสร้าง PDF...' : 'Download PDF'}
          </Button>
        )}
      </PDFDownloadLink>

      {/* Inline viewer */}
      {showPreview && (
        <div className="mt-4 border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <PDFViewer width="100%" height="100%">
            <QuotationPDFComponent quotation={quotation} />
          </PDFViewer>
        </div>
      )}
    </div>
  )
}

interface PDFPreviewButtonProps {
  quotation: Quotation
}

export function PDFPreviewModal({ quotation }: PDFPreviewButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FileText className="w-4 h-4" /> Preview PDF
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Preview: {quotation.quotation_number}</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer width="100%" height="100%">
                <QuotationPDFComponent quotation={quotation} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
