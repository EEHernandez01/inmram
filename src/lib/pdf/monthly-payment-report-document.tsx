import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatCurrency, formatDate, formatReceiptPeriodRange } from "@/lib/format";

type ReportPayment = {
  id: string;
  tenant: string;
  property: string;
  unit: string;
  period: Date;
  periodEnd: Date;
  paymentDate: Date;
  amount: number;
  method: string;
  reference: string | null;
  reversedAt: Date | null;
  currentBalance: number;
  showBalance: boolean;
};

type TenantGroup = { tenant: string; payments: ReportPayment[]; total: number };

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#1C1917", fontFamily: "Helvetica", fontSize: 8, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 38 },
  title: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 17 },
  subtitle: { color: "#57534E", fontSize: 9, marginTop: 5 },
  summary: { backgroundColor: "#F5F5F4", flexDirection: "row", justifyContent: "space-between", marginTop: 16, padding: 10 },
  summaryLabel: { color: "#57534E", fontSize: 8 },
  summaryValue: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 3 },
  tenant: { borderBottomColor: "#D6D3D1", borderBottomWidth: 1, color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 6, paddingBottom: 5 },
  group: { marginTop: 16 },
  row: { alignItems: "center", borderBottomColor: "#E7E5E4", borderBottomWidth: 0.5, flexDirection: "row", minHeight: 26, paddingVertical: 5 },
  header: { backgroundColor: "#F5F5F4", color: "#57534E", fontFamily: "Helvetica-Bold", fontSize: 7, minHeight: 22 },
  colDate: { width: "10%" },
  colProperty: { width: "24%" },
  colPeriod: { width: "17%" },
  colMethod: { width: "19%" },
  colAmount: { textAlign: "right", width: "13%" },
  colBalance: { textAlign: "right", width: "17%" },
  reversed: { color: "#B91C1C", textDecoration: "line-through" },
  total: { borderTopColor: "#A8A29E", borderTopWidth: 1, flexDirection: "row", justifyContent: "flex-end", marginTop: 5, paddingTop: 6 },
  totalLabel: { color: "#57534E", marginRight: 12 },
  totalValue: { fontFamily: "Helvetica-Bold", width: "13%", textAlign: "right" },
  footer: { bottom: 17, color: "#57534E", fontSize: 7, left: 28, position: "absolute", right: 28, textAlign: "center" },
  pageNumber: { bottom: 17, color: "#78716C", fontSize: 7, position: "absolute", right: 28 },
});

function methodName(method: string) {
  return method === "EFECTIVO" ? "Efectivo" : "Transferencia";
}

export function MonthlyPaymentReportDocument({ data }: { data: { month: string; issuer: string; totalReceived: number; totalReversed: number; tenants: TenantGroup[] } }) {
  return <Document title={`Pagos recibidos ${data.month}`} author={data.issuer}>
    <Page size="LETTER" orientation="landscape" style={styles.page} wrap>
      <Text style={styles.title}>REPORTE MENSUAL DE PAGOS RECIBIDOS</Text>
      <Text style={styles.subtitle}>{data.month} · {data.issuer}</Text>
      <View style={styles.summary}>
        <View><Text style={styles.summaryLabel}>TOTAL RECIBIDO</Text><Text style={styles.summaryValue}>{formatCurrency(data.totalReceived)}</Text></View>
        <View><Text style={styles.summaryLabel}>PAGOS REVERTIDOS EN EL DETALLE</Text><Text style={styles.summaryValue}>{formatCurrency(data.totalReversed)}</Text></View>
      </View>
      {data.tenants.map((tenant) => <View key={tenant.tenant} style={styles.group} wrap>
        <Text style={styles.tenant}>{tenant.tenant} · Total recibido: {formatCurrency(tenant.total)}</Text>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.colDate}>Fecha</Text><Text style={styles.colProperty}>Inmueble / unidad</Text><Text style={styles.colPeriod}>Periodo cubierto</Text><Text style={styles.colMethod}>Forma / referencia</Text><Text style={styles.colAmount}>Pago</Text><Text style={styles.colBalance}>Saldo actual</Text>
        </View>
        {tenant.payments.map((payment) => <View key={payment.id} style={styles.row} wrap={false}>
          <Text style={[styles.colDate, payment.reversedAt ? styles.reversed : {}]}>{formatDate(payment.paymentDate)}{payment.reversedAt ? " · REVERTIDO" : ""}</Text>
          <Text style={[styles.colProperty, payment.reversedAt ? styles.reversed : {}]}>{payment.property} · {payment.unit}</Text>
          <Text style={[styles.colPeriod, payment.reversedAt ? styles.reversed : {}]}>{formatReceiptPeriodRange(payment.period, payment.periodEnd)}</Text>
          <Text style={[styles.colMethod, payment.reversedAt ? styles.reversed : {}]}>{methodName(payment.method)}{payment.reference ? ` · ${payment.reference}` : ""}</Text>
          <Text style={[styles.colAmount, payment.reversedAt ? styles.reversed : {}]}>{formatCurrency(payment.amount)}</Text>
          <Text style={styles.colBalance}>{payment.showBalance ? formatCurrency(payment.currentBalance) : ""}</Text>
        </View>)}
        <View style={styles.total}><Text style={styles.totalLabel}>Subtotal recibido</Text><Text style={styles.totalValue}>{formatCurrency(tenant.total)}</Text></View>
      </View>)}
      <Text style={styles.footer}>Reporte administrativo de pagos. No es CFDI ni comprobante fiscal.</Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  </Document>;
}
