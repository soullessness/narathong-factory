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
import { Quotation } from '@/types/quotation'
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

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansThai',
    fontSize: 10,
    padding: 30,
    color: '#1a1a1a',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#7B4F2E',
    paddingBottom: 12,
  },
  logo: {
    width: 100,
    height: 100,
    marginRight: 16,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'NotoSansThai',
    color: '#7B4F2E',
    marginBottom: 2,
  },
  companyNameEn: {
    fontSize: 11,
    fontFamily: 'NotoSansThai',
    color: '#7B4F2E',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginBottom: 1,
  },
  // Badge for "ใบเสนอราคา"
  docTitleBadge: {
    backgroundColor: '#7B4F2E',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  docTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'NotoSansThai',
    color: '#ffffff',
  },
  // Customer / Meta section
  metaRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  customerBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  metaBox: {
    width: 180,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#333',
    marginBottom: 6,
  },
  boldText: {
    fontSize: 10,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  normalText: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#555',
    marginBottom: 2,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#7B4F2E',
    padding: 6,
    borderRadius: 2,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 36,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#fdf6f0',
  },
  colNo: { width: 18, textAlign: 'center' },
  colImg: { width: 72 },
  colName: { flex: 1, paddingLeft: 4 },
  colQty: { width: 32, textAlign: 'right' },
  colUnit: { width: 26, textAlign: 'center' },
  colPrice: { width: 50, textAlign: 'right' },
  colSqm: { width: 50, textAlign: 'right' },
  colSqmTotal: { width: 56, textAlign: 'right' },
  colTotal: { width: 56, textAlign: 'right' },
  thText: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#fff',
    fontWeight: 'bold',
  },
  tdText: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#333',
  },
  tdTextBold: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  productImage: {
    width: 70,
    height: 70,
    objectFit: 'contain',
    borderRadius: 2,
  },
  // Summary
  summaryContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    minWidth: 240,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'NotoSansThai',
    color: '#555',
    width: 130,
    textAlign: 'right',
    paddingRight: 12,
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: 'NotoSansThai',
    color: '#333',
    width: 90,
    textAlign: 'right',
  },
  totalSeparator: {
    width: 240,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginBottom: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 0,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#7B4F2E',
    minWidth: 240,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: '#7B4F2E',
    width: 130,
    textAlign: 'right',
    paddingRight: 12,
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'NotoSansThai',
    fontWeight: 'bold',
    color: '#7B4F2E',
    width: 90,
    textAlign: 'right',
  },
  // Footer
  footerRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 16,
  },
  footerBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#888',
  },
  notesSection: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#888',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 9,
    fontFamily: 'NotoSansThai',
    color: '#555',
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

interface QuotationPDFProps {
  quotation: Quotation
}

export function QuotationPDF({ quotation }: QuotationPDFProps) {
  const customer = quotation.projects?.customers
  const cleanNotes = (quotation.notes || '')
    .replace(/__META__[\s\S]*?__END__/, '')
    .trim()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image
            src={NARATHONG_LOGO_BASE64}
            style={styles.logo}
          />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>บริษัท นราทองพลัส จำกัด</Text>
            <Text style={styles.companyNameEn}>NARATHONG PLUS Co.,Ltd.</Text>
            <Text style={styles.companyDetail}>
              88/8 หมู่ที่ 11 ตำบลลำภู อำเภอเมือง จังหวัดนราธิวาส 96000
            </Text>
            <Text style={styles.companyDetail}>
              เลขผู้เสียภาษี: 0965557000196
            </Text>
            <Text style={styles.companyDetail}>
              โทร: 073-511555  แฟกซ์: 073-532378
            </Text>
          </View>
          {/* Badge "ใบเสนอราคา" */}
          <View style={styles.docTitleBadge}>
            <Text style={styles.docTitleText}>ใบเสนอราคา</Text>
          </View>
        </View>

        {/* Customer & Meta */}
        <View style={styles.metaRow}>
          <View style={styles.customerBox}>
            <Text style={styles.sectionLabel}>เสนอให้ / To:</Text>
            <Text style={styles.boldText}>{customer?.name || '-'}</Text>
            {customer?.address && (
              <Text style={styles.normalText}>{customer.address}</Text>
            )}
            {customer?.phone && (
              <Text style={styles.normalText}>โทร: {customer.phone}</Text>
            )}
            {customer?.email && (
              <Text style={styles.normalText}>{customer.email}</Text>
            )}
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>เลขที่ใบเสนอราคา</Text>
            <Text style={styles.metaValue}>{quotation.quotation_number || '-'}</Text>
            <Text style={styles.metaLabel}>วันที่ออก</Text>
            <Text style={styles.metaValue}>{formatDate(quotation.created_at)}</Text>
            <Text style={styles.metaLabel}>ใช้ได้ถึง</Text>
            <Text style={styles.metaValue}>{formatDate(quotation.valid_until)}</Text>
            {quotation.projects?.name && (
              <>
                <Text style={styles.metaLabel}>โปรเจค</Text>
                <Text style={styles.metaValue}>{quotation.projects.name}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colNo]}>ที่</Text>
          <Text style={[styles.thText, styles.colImg]}>รูป</Text>
          <Text style={[styles.thText, styles.colName]}>รายการสินค้า</Text>
          <Text style={[styles.thText, styles.colQty]}>จำนวน</Text>
          <Text style={[styles.thText, styles.colUnit]}>หน่วย</Text>
          <Text style={[styles.thText, styles.colPrice]}>ราคา/หน่วย</Text>
          <Text style={[styles.thText, styles.colSqm]}>ราคา/ตร.ม.</Text>
          <Text style={[styles.thText, styles.colSqmTotal]}>รวม ตร.ม./แพ็ค</Text>
          <Text style={[styles.thText, styles.colTotal]}>รวม (บาท)</Text>
        </View>

        {quotation.items.map((item, idx) => (
          <View
            key={item.id}
            style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={[styles.tdText, styles.colNo]}>{idx + 1}</Text>
            <View style={styles.colImg}>
              {item.image_url ? (
                <Image src={item.image_url} style={styles.productImage} />
              ) : (
                <View
                  style={[
                    styles.productImage,
                    { backgroundColor: '#f0e8e0', borderRadius: 2 },
                  ]}
                />
              )}
            </View>
            <View style={styles.colName}>
              <Text style={styles.tdTextBold}>{item.name}</Text>
              {item.description ? (
                <Text style={[styles.tdText, { color: '#777', fontSize: 8 }]}>
                  {item.description}
                </Text>
              ) : null}
              {item.price_per_pack && item.pieces_per_pack ? (
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 7, color: '#166534', fontFamily: 'NotoSansThai' }}>แพ็ค {formatCurrency(item.price_per_pack)} บาท ({item.pieces_per_pack} แผ่น)</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tdText, styles.colQty]}>
              {item.quantity.toLocaleString()}
            </Text>
            <Text style={[styles.tdText, styles.colUnit]}>{item.unit}</Text>
            <Text style={[styles.tdText, styles.colPrice]}>
              {formatCurrency(item.unit_price)}
            </Text>
            <Text style={[styles.tdText, styles.colSqm]}>
              {item.price_per_sqm ? formatCurrency(item.price_per_sqm) : '-'}
            </Text>
            <View style={styles.colSqmTotal}>
              {item.price_per_sqm && item.price_per_sqm > 0 && item.quantity ? (
                <Text style={[styles.tdText, { textAlign: 'right' }]}>
                  {(() => {
                    const areaPer = item.unit_price / item.price_per_sqm!
                    const totalSqm = item.quantity * areaPer
                    return `${totalSqm.toFixed(2)} ตร.ม.`
                  })()}
                </Text>
              ) : (
                <Text style={[styles.tdText, { textAlign: 'right' }]}>-</Text>
              )}
              {item.pieces_per_pack && item.pieces_per_pack > 0 && item.quantity ? (
                <Text style={[styles.tdText, { textAlign: 'right', color: '#166534', fontSize: 8, marginTop: 2 }]}>
                  {(item.quantity / item.pieces_per_pack).toFixed(1)} แพ็ค
                </Text>
              ) : null}
            </View>
            <Text style={[styles.tdTextBold, styles.colTotal]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมก่อนหักส่วนลด</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quotation.subtotal)} บาท</Text>
          </View>
          {quotation.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ส่วนลด</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                -{formatCurrency(quotation.discount)} บาท
              </Text>
            </View>
          )}
          {quotation.vat_enabled && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ภาษีมูลค่าเพิ่ม 7%</Text>
              <Text style={styles.summaryValue}>{formatCurrency(quotation.vat_amount)} บาท</Text>
            </View>
          )}
          {/* Thin separator before total */}
          <View style={styles.totalSeparator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.total)} บาท</Text>
          </View>
        </View>

        {/* Notes — only shown when notes exist */}
        {cleanNotes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>หมายเหตุ</Text>
            <Text style={styles.notesText}>{cleanNotes}</Text>
          </View>
        ) : null}

        {/* Signature Footer */}
        <View style={styles.footerRow}>
          <View style={styles.footerBox}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSansThai', color: '#aaa', marginBottom: 20 }}>
              ลายเซ็น
            </Text>
            <Text style={styles.footerLabel}>{'_'.repeat(20)}</Text>
            <Text style={[styles.footerLabel, { marginTop: 4 }]}>
              ผู้เสนอราคา / Authorized Signature
            </Text>
            <Text style={[styles.footerLabel, { marginTop: 2 }]}>
              วันที่: _______________
            </Text>
          </View>
          <View style={styles.footerBox}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSansThai', color: '#aaa', marginBottom: 20 }}>
              ลายเซ็น
            </Text>
            <Text style={styles.footerLabel}>{'_'.repeat(20)}</Text>
            <Text style={[styles.footerLabel, { marginTop: 4 }]}>
              ผู้อนุมัติ / Approved By
            </Text>
            <Text style={[styles.footerLabel, { marginTop: 2 }]}>
              วันที่: _______________
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
