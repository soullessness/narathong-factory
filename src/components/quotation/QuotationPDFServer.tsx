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

const BROWN = '#2BA8D4'
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

  // ─── SECTION 3: พื้นที่แยกประเภท ────────────────────────────
  areaBreakdownBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e8d5c4',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  areaBreakdownLeft: {
    flex: 1,
    padding: 8,
    backgroundColor: LIGHT_BG,
    borderRightWidth: 1,
    borderRightColor: '#e8d5c4',
  },
  areaBreakdownRight: {
    width: 130,
    padding: 8,
    backgroundColor: LIGHT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaBreakdownTitle: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  areaBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  areaCheckBox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: BROWN,
    borderRadius: 1,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaCheckBoxFilled: {
    backgroundColor: BROWN,
  },
  areaCheckMark: {
    fontSize: 6,
    color: '#fff',
    fontFamily: 'NotoSansThai',
  },
  areaRowLabel: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#444',
    width: 52,
  },
  areaRowValue: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  areaTotalLabel: {
    fontSize: 8,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginBottom: 3,
  },
  areaTotalValue: {
    fontSize: 14,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: BROWN,
  },
  areaTotalUnit: {
    fontSize: 8,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginTop: 1,
  },

  // ─── SECTION 3b: พนักงานขาย + ตัวแทน (ก่อน table) ──────────
  salesAgentBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    gap: 20,
  },
  salesAgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  salesAgentLabel: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    width: 72,
    flexShrink: 0,
  },
  salesAgentName: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    fontWeight: 'bold',
    flex: 1,
  },
  salesAgentPhone: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
  },

  // ─── SECTION 5b: ผู้ดูแลและติดต่อ (หลัง summary) ────────────
  contactBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e8d5c4',
    borderRadius: 4,
    padding: 10,
    backgroundColor: LIGHT_BG,
  },
  contactBoxTitle: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: BROWN,
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  contactLabel: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    width: 80,
    flexShrink: 0,
  },
  contactName: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginRight: 12,
  },
  contactPhone: {
    fontSize: 8.5,
    fontFamily: 'NotoSansThai',
    color: '#555',
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
  colNo: { width: 20, textAlign: 'center' },
  colImg: { width: 48 },
  productImage: { width: 40, height: 40, objectFit: 'contain', borderRadius: 2 },
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

  // ─── SECTION 5: Summary (total row highlight) ────────────────
  totalRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderTopWidth: 2,
    borderTopColor: BROWN,
    minWidth: 250,
    backgroundColor: '#fdf6f0',
    borderRadius: 4,
  },

  // ─── SECTION 7: Signature ────────────────────────────────────
  signatureSection: {
    marginTop: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0d0c0',
    borderRadius: 4,
    backgroundColor: '#fdfaf7',
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  signatureLineView: {
    width: '75%',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 7.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginTop: 2,
  },
  signatureDate: {
    fontSize: 7.5,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginTop: 2,
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

  // คำนวณพื้นที่แยกตาม category_slug
  const calcSqm = (slug: string) =>
    quotation.items
      .filter((i) => i.category_slug === slug)
      .reduce((sum, item) => {
        const area = getAreaPerPiece(item)
        return area !== null ? sum + item.quantity * area : sum
      }, 0)

  const floorSqm = calcSqm('floor')
  const wallSqm = calcSqm('wall')
  const ceilingSqm = calcSqm('ceiling')
  const totalArea = floorSqm + wallSqm + ceilingSqm

  // fallback: ถ้าไม่มี category_slug เลย คำนวณรวมจากทุก item ที่มี price_per_sqm
  const totalAreaFallback = quotation.items.reduce((sum, item) => {
    const area = getAreaPerPiece(item)
    if (area !== null) {
      return sum + item.quantity * area
    }
    return sum
  }, 0)

  const hasCategoryData = quotation.items.some((i) => i.category_slug)
  const effectiveTotalArea = hasCategoryData ? totalArea : totalAreaFallback

  const hasSqmItems = quotation.items.some(
    (item) => item.price_per_sqm && item.price_per_sqm > 0
  )

  // พนักงานขาย / ตัวแทน
  const hasSalesInfo = !!(
    quotation.sales_name ||
    quotation.agent_name
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

        {/* ─── SECTION 3: พื้นที่แยกประเภท (ถ้ามี) ─── */}
        {hasSqmItems && (
          <View style={styles.areaBreakdownBox}>
            {/* LEFT: แสดงพื้นที่แยกประเภท */}
            <View style={styles.areaBreakdownLeft}>
              <Text style={styles.areaBreakdownTitle}>พื้นที่</Text>
              {hasCategoryData ? (
                <>
                  {floorSqm > 0 && (
                    <View style={styles.areaBreakdownRow}>
                      <View style={[styles.areaCheckBox, styles.areaCheckBoxFilled]}>
                        <Text style={styles.areaCheckMark}>✓</Text>
                      </View>
                      <Text style={styles.areaRowLabel}>ปูพื้น</Text>
                      <Text style={styles.areaRowValue}>{floorSqm.toFixed(2)} ตร.ม.</Text>
                    </View>
                  )}
                  {wallSqm > 0 && (
                    <View style={styles.areaBreakdownRow}>
                      <View style={[styles.areaCheckBox, styles.areaCheckBoxFilled]}>
                        <Text style={styles.areaCheckMark}>✓</Text>
                      </View>
                      <Text style={styles.areaRowLabel}>กรุผนัง</Text>
                      <Text style={styles.areaRowValue}>{wallSqm.toFixed(2)} ตร.ม.</Text>
                    </View>
                  )}
                  {ceilingSqm > 0 && (
                    <View style={styles.areaBreakdownRow}>
                      <View style={[styles.areaCheckBox, styles.areaCheckBoxFilled]}>
                        <Text style={styles.areaCheckMark}>✓</Text>
                      </View>
                      <Text style={styles.areaRowLabel}>ฝ้า</Text>
                      <Text style={styles.areaRowValue}>{ceilingSqm.toFixed(2)} ตร.ม.</Text>
                    </View>
                  )}
                  {floorSqm === 0 && wallSqm === 0 && ceilingSqm === 0 && (
                    <View style={styles.areaBreakdownRow}>
                      <View style={[styles.areaCheckBox, styles.areaCheckBoxFilled]}>
                        <Text style={styles.areaCheckMark}>✓</Text>
                      </View>
                      <Text style={styles.areaRowLabel}>รวม</Text>
                      <Text style={styles.areaRowValue}>{effectiveTotalArea.toFixed(2)} ตร.ม.</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.areaBreakdownRow}>
                  <View style={[styles.areaCheckBox, styles.areaCheckBoxFilled]}>
                    <Text style={styles.areaCheckMark}>✓</Text>
                  </View>
                  <Text style={styles.areaRowLabel}>รวม</Text>
                  <Text style={styles.areaRowValue}>{effectiveTotalArea.toFixed(2)} ตร.ม.</Text>
                </View>
              )}
            </View>

            {/* RIGHT: พื้นที่รวม */}
            <View style={styles.areaBreakdownRight}>
              <Text style={styles.areaTotalLabel}>พื้นที่รวม</Text>
              <Text style={styles.areaTotalValue}>{effectiveTotalArea.toFixed(2)}</Text>
              <Text style={styles.areaTotalUnit}>ตร.ม.</Text>
            </View>
          </View>
        )}

        {/* ─── SECTION 3b: พนักงานขาย + ตัวแทน (ถ้ามี) ─── */}
        {hasSalesInfo && (
          <View style={styles.salesAgentBox}>
            {quotation.sales_name ? (
              <View style={styles.salesAgentRow}>
                <Text style={styles.salesAgentLabel}>พนักงานขาย:</Text>
                <Text style={styles.salesAgentName}>{quotation.sales_name}</Text>
                {quotation.sales_phone ? (
                  <Text style={styles.salesAgentPhone}>โทร. {quotation.sales_phone}</Text>
                ) : null}
              </View>
            ) : null}
            {quotation.agent_name ? (
              <View style={styles.salesAgentRow}>
                <Text style={styles.salesAgentLabel}>ตัวแทนจำหน่าย:</Text>
                <Text style={styles.salesAgentName}>{quotation.agent_name}</Text>
                {quotation.agent_phone ? (
                  <Text style={styles.salesAgentPhone}>โทร. {quotation.agent_phone}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        {/* ─── SECTION 4: Table ─── */}
        {/* Header row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colNo]}>ที่</Text>
          <Text style={[styles.thText, styles.colImg]}> </Text>
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
              <View style={styles.colImg}>
                {item.image_url ? (
                  <Image src={item.image_url} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: '#f5f0eb' }]} />
                )}
              </View>
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
          <View style={styles.totalRowHighlight}>
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

        {/* ─── SECTION 5b: ผู้ดูแลและติดต่อ — ซ่อนแล้ว (แสดงอยู่เหนือตารางแล้ว) ─── */}

        {/* ─── SECTION 7: Signature (1 แถว 4 ช่อง) ─── */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{' ผู้จัดทำ '}</Text>
              <View style={styles.signatureLineView} />
              <Text style={styles.signatureName}>{'(................................)'}</Text>
              <Text style={styles.signatureDate}>{'วันที่ ...................'}</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{' ผู้ตรวจสอบ '}</Text>
              <View style={styles.signatureLineView} />
              <Text style={styles.signatureName}>{'(................................)'}</Text>
              <Text style={styles.signatureDate}>{'วันที่ ...................'}</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{' ผู้อนุมัติ '}</Text>
              <View style={styles.signatureLineView} />
              <Text style={styles.signatureName}>{'(................................)'}</Text>
              <Text style={styles.signatureDate}>{'วันที่ ...................'}</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>{' ลูกค้าเซ็นรับราคา '}</Text>
              <View style={styles.signatureLineView} />
              <Text style={styles.signatureName}>{'(................................)'}</Text>
              <Text style={styles.signatureDate}>{'วันที่ ...................'}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
