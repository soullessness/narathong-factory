import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { Quotation, QuotationItem } from '@/types/quotation'
import { NARATHONG_LOGO_BASE64 } from '@/lib/logoBase64'
import { NOTO_SANS_THAI_BASE64, NOTO_SANS_THAI_BOLD_BASE64 } from '@/lib/fontBase64'

// Register Kanit font (Thai) using base64 to avoid server-side URL issues
Font.register({
  family: 'NotoSansThai',
  fonts: [
    { src: NOTO_SANS_THAI_BASE64, fontWeight: 'normal' },
    { src: NOTO_SANS_THAI_BOLD_BASE64, fontWeight: 'bold' },
  ],
})

const BROWN = '#7B4F2E'
const LIGHT_BG = '#fdf6f0'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansThai',
    fontSize: 9,
    padding: 30,
    color: '#1a1a1a',
  },

  // ─── SECTION 1: Header ───────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: BROWN,
    paddingBottom: 10,
  },
  logo: {
    width: 90,
    height: 90,
    marginRight: 14,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'NotoSansThai',
    color: BROWN,
    marginBottom: 1,
  },
  companyNameEn: {
    fontSize: 11,
    fontFamily: 'NotoSansThai',
    color: BROWN,
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginBottom: 1,
  },
  docTitleBadge: {
    backgroundColor: BROWN,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-end',
  },
  docTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'NotoSansThai',
    color: '#ffffff',
  },

  // ─── SECTION 2: Info bar ─────────────────────────────────────
  infoBar: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  infoLeft: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  infoRight: {
    width: 190,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    width: 75,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    flex: 1,
  },
  infoValueBold: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },

  // ─── SECTION 3: พื้นที่รวม ────────────────────────────────────
  areaSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8d5c4',
  },
  areaSummaryLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#555',
    fontWeight: 'bold',
  },
  areaSummaryValue: {
    fontSize: 10,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: BROWN,
    marginLeft: 6,
  },

  // ─── SECTION 4: Table ────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BROWN,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 2,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 7,
    paddingHorizontal: 4,
    minHeight: 28,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: LIGHT_BG,
  },

  // Column widths (total ≈ 535pt for A4 - 2×30 padding)
  colNo: { width: 22, textAlign: 'center' },
  colName: { flex: 1, paddingHorizontal: 4 },
  colPcsPerSqm: { width: 42, textAlign: 'right' },
  colPcsPerBox: { width: 42, textAlign: 'right' },
  colBoxQty: { width: 44, textAlign: 'right' },
  colUnitPrice: { width: 48, textAlign: 'right' },
  colBoxPrice: { width: 48, textAlign: 'right' },
  colSqmPrice: { width: 48, textAlign: 'right' },
  colTotal: { width: 56, textAlign: 'right' },

  thText: {
    fontSize: 7.5,
    fontFamily: 'NotoSansThai',
    color: '#fff',
    fontWeight: 'bold',
  },
  tdText: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#333',
  },
  tdTextBold: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  tdDesc: {
    fontSize: 7.5,
    fontFamily: 'NotoSansThai',
    color: '#777',
    marginTop: 1,
  },

  // ─── SECTION 5: Summary ───────────────────────────────────────
  summaryContainer: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    minWidth: 250,
  },
  summaryLabel: {
    fontSize: 9.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
    width: 140,
    textAlign: 'right',
    paddingRight: 12,
  },
  summaryValue: {
    fontSize: 9.5,
    fontFamily: 'NotoSansThai',
    color: '#333',
    width: 90,
    textAlign: 'right',
  },
  summaryDiscountValue: {
    fontSize: 9.5,
    fontFamily: 'NotoSansThai',
    color: '#dc2626',
    width: 90,
    textAlign: 'right',
  },
  totalSeparator: {
    width: 250,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginBottom: 5,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: BROWN,
    minWidth: 250,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: BROWN,
    width: 140,
    textAlign: 'right',
    paddingRight: 12,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: BROWN,
    width: 90,
    textAlign: 'right',
  },

  // ─── SECTION 6: Notes ────────────────────────────────────────
  notesSection: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  notesLabel: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
  },

  // ─── SECTION 7: Signature ────────────────────────────────────
  signatureSection: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 10,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  signatureTitle: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginBottom: 20,
  },
  signatureLine: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#333',
    letterSpacing: 0,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginTop: 4,
  },
  signatureDate: {
    fontSize: 8,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginTop: 3,
  },
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** คำนวณ area_per_piece จาก unit_price / price_per_sqm */
function getAreaPerPiece(item: QuotationItem): number | null {
  if (item.price_per_sqm && item.price_per_sqm > 0 && item.unit_price > 0) {
    return item.unit_price / item.price_per_sqm
  }
  return null
}

interface QuotationPDFProps {
  quotation: Quotation
}

export function QuotationPDF({ quotation }: QuotationPDFProps) {
  const customer = quotation.projects?.customers
  const cleanNotes = (quotation.notes || '')
    .replace(/__META__[\s\S]*?__END__/, '')
    .trim()

  // คำนวณพื้นที่รวม (จาก items ที่มี price_per_sqm)
  const totalArea = quotation.items.reduce((sum, item) => {
    const area = getAreaPerPiece(item)
    if (area !== null) {
      return sum + item.quantity * area
    }
    return sum
  }, 0)
  const hasSqmItems = quotation.items.some(
    (item) => item.price_per_sqm && item.price_per_sqm > 0
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ─── SECTION 1: Header ─── */}
        <View style={styles.headerRow}>
          <Image src={NARATHONG_LOGO_BASE64} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>บริษัท นราทองพลัส จำกัด</Text>
            <Text style={styles.companyNameEn}>NARATHONG PLUS Co.,Ltd.</Text>
            <Text style={styles.companyDetail}>
              88/8 หมู่ที่ 11 ตำบลลำภู อำเภอเมือง จังหวัดนราธิวาส 96000
            </Text>
            <Text style={styles.companyDetail}>
              โทร. 073-511555{'  '}แฟกซ์. 073-532378
            </Text>
            <Text style={styles.companyDetail}>
              เลขผู้เสียภาษี: 0965557000196
            </Text>
          </View>
          <View style={styles.docTitleBadge}>
            <Text style={styles.docTitleText}>ใบเสนอราคา</Text>
          </View>
        </View>

        {/* ─── SECTION 2: Info bar ─── */}
        <View style={styles.infoBar}>
          {/* LEFT: ข้อมูลลูกค้า */}
          <View style={styles.infoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เรียน:</Text>
              <Text style={styles.infoValueBold}>{customer?.name || '-'}</Text>
            </View>
            {customer?.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ที่อยู่:</Text>
                <Text style={styles.infoValue}>{customer.address}</Text>
              </View>
            ) : null}
            {customer?.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>โทร:</Text>
                <Text style={styles.infoValue}>{customer.phone}</Text>
              </View>
            ) : null}
            {quotation.projects?.name ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>โครงการ:</Text>
                <Text style={styles.infoValue}>{quotation.projects.name}</Text>
              </View>
            ) : null}
          </View>

          {/* RIGHT: เลขที่ / วันที่ */}
          <View style={styles.infoRight}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เลขที่:</Text>
              <Text style={styles.infoValueBold}>
                {quotation.quotation_number || '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>วันที่:</Text>
              <Text style={styles.infoValue}>{formatDate(quotation.created_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>กำหนดยืนราคา:</Text>
              <Text style={styles.infoValue}>{formatDate(quotation.valid_until)}</Text>
            </View>
          </View>
        </View>

        {/* ─── SECTION 3: พื้นที่รวม (ถ้ามี) ─── */}
        {hasSqmItems && (
          <View style={styles.areaSummaryRow}>
            <Text style={styles.areaSummaryLabel}>พื้นที่รวม:</Text>
            <Text style={styles.areaSummaryValue}>
              {totalArea.toFixed(2)} ตร.ม.
            </Text>
          </View>
        )}

        {/* ─── SECTION 4: Table ─── */}
        {/* Header row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colNo]}>ที่</Text>
          <Text style={[styles.thText, styles.colName]}>รายการสินค้า</Text>
          <Text style={[styles.thText, styles.colPcsPerSqm]}>แผ่น/ตร.ม.</Text>
          <Text style={[styles.thText, styles.colPcsPerBox]}>แผ่น/กล่อง</Text>
          <Text style={[styles.thText, styles.colBoxQty]}>จำนวน(กล่อง)</Text>
          <Text style={[styles.thText, styles.colUnitPrice]}>ราคา/แผ่น</Text>
          <Text style={[styles.thText, styles.colBoxPrice]}>ราคา/กล่อง</Text>
          <Text style={[styles.thText, styles.colSqmPrice]}>ราคา/ตร.ม.</Text>
          <Text style={[styles.thText, styles.colTotal]}>รวม (บาท)</Text>
        </View>

        {quotation.items.map((item, idx) => {
          const areaPerPiece = getAreaPerPiece(item)
          const pcsPerSqm =
            areaPerPiece && areaPerPiece > 0
              ? (1 / areaPerPiece).toFixed(2)
              : null
          const pcsPerBox = item.pieces_per_pack ?? null
          const boxQty =
            pcsPerBox && pcsPerBox > 0
              ? (item.quantity / pcsPerBox).toFixed(2)
              : null

          return (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tdText, styles.colNo]}>{idx + 1}</Text>
              <View style={styles.colName}>
                <Text style={styles.tdTextBold}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.tdDesc}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.tdText, styles.colPcsPerSqm]}>
                {pcsPerSqm ?? '-'}
              </Text>
              <Text style={[styles.tdText, styles.colPcsPerBox]}>
                {pcsPerBox !== null ? pcsPerBox.toString() : '-'}
              </Text>
              <Text style={[styles.tdText, styles.colBoxQty]}>
                {boxQty ?? item.quantity.toLocaleString()}
              </Text>
              <Text style={[styles.tdText, styles.colUnitPrice]}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={[styles.tdText, styles.colBoxPrice]}>
                {item.price_per_pack != null
                  ? formatCurrency(item.price_per_pack)
                  : '-'}
              </Text>
              <Text style={[styles.tdText, styles.colSqmPrice]}>
                {item.price_per_sqm != null
                  ? formatCurrency(item.price_per_sqm)
                  : '-'}
              </Text>
              <Text style={[styles.tdTextBold, styles.colTotal]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          )
        })}

        {/* ─── SECTION 5: Summary ─── */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ราคารวม:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(quotation.subtotal)} บาท
            </Text>
          </View>
          {quotation.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ส่วนลด:</Text>
              <Text style={styles.summaryDiscountValue}>
                -{formatCurrency(quotation.discount)} บาท
              </Text>
            </View>
          )}
          {quotation.vat_enabled && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ภาษีมูลค่าเพิ่ม 7%:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(quotation.vat_amount)} บาท
              </Text>
            </View>
          )}
          <View style={styles.totalSeparator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ราคาสุทธิ:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(quotation.total)} บาท
            </Text>
          </View>
        </View>

        {/* ─── SECTION 6: Notes ─── */}
        {cleanNotes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>หมายเหตุ</Text>
            <Text style={styles.notesText}>{cleanNotes}</Text>
          </View>
        ) : null}

        {/* ─── SECTION 7: Signature (4 ช่อง) ─── */}
        <View style={styles.signatureSection}>
          {/* ผู้จัดทำ */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>ผู้จัดทำ</Text>
            <Text style={styles.signatureLine}>{'_'.repeat(18)}</Text>
            <Text style={styles.signatureName}>{'(................)'}</Text>
            <Text style={styles.signatureDate}>วันที่ ..........</Text>
          </View>
          {/* ผู้ตรวจสอบ */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>ผู้ตรวจสอบ</Text>
            <Text style={styles.signatureLine}>{'_'.repeat(18)}</Text>
            <Text style={styles.signatureName}>{'(................)'}</Text>
            <Text style={styles.signatureDate}>วันที่ ..........</Text>
          </View>
          {/* ผู้อนุมัติ */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>ผู้อนุมัติ</Text>
            <Text style={styles.signatureLine}>{'_'.repeat(18)}</Text>
            <Text style={styles.signatureName}>{'(................)'}</Text>
            <Text style={styles.signatureDate}>วันที่ ..........</Text>
          </View>
          {/* ลูกค้าเซ็นรับราคา */}
          <View style={[styles.signatureBox, { flex: 1.5 }]}>
            <Text style={styles.signatureTitle}>ลูกค้าเซ็นรับราคา</Text>
            <Text style={styles.signatureLine}>{'_'.repeat(26)}</Text>
            <Text style={styles.signatureName}>{'(................................)'}</Text>
            <Text style={styles.signatureDate}>วันที่ ..........</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
