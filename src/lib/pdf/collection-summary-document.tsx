import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatCurrency, formatDate } from "@/lib/format";

export type CollectionSummaryRow = {
  id: string;
  address: string;
  unit: string;
  tenant: string;
  amountDue: number;
  dueDate: Date;
  status: string;
};

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#1C1917", fontFamily: "Helvetica", fontSize: 8, paddingHorizontal: 30, paddingTop: 32, paddingBottom: 42 },
  title: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 18 },
  subtitle: { color: "#57534E", fontSize: 9, marginTop: 5 },
  summary: { backgroundColor: "#F5F5F4", flexDirection: "row", justifyContent: "space-between", marginTop: 17, padding: 11 },
  summaryLabel: { color: "#57534E", fontSize: 8 },
  summaryValue: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 4 },
  table: { marginTop: 17 },
  row: { alignItems: "center", borderBottomColor: "#E7E5E4", borderBottomWidth: 0.5, flexDirection: "row", minHeight: 27, paddingHorizontal: 5, paddingVertical: 6 },
  header: { backgroundColor: "#F5F5F4", color: "#57534E", fontFamily: "Helvetica-Bold", fontSize: 7, minHeight: 23 },
  address: { width: "34%" },
  tenant: { width: "23%" },
  amount: { textAlign: "right", width: "16%" },
  dueDate: { textAlign: "center", width: "13%" },
  status: { textAlign: "right", width: "14%" },
  muted: { color: "#78716C" },
  footer: { bottom: 18, color: "#57534E", fontSize: 7, left: 30, position: "absolute", right: 30, textAlign: "center" },
  pageNumber: { bottom: 18, color: "#78716C", fontSize: 7, position: "absolute", right: 30 },
});

export function CollectionSummaryDocument({ data }: { data: { period: string; issuer: string; totalDue: number; rows: CollectionSummaryRow[] } }) {
  return <Document title={`Resumen de cobranza ${data.period}`} author={data.issuer}>
    <Page size="LETTER" orientation="landscape" style={styles.page} wrap>
      <Text style={styles.title}>HOJA RESUMEN DE COBRANZA</Text>
      <Text style={styles.subtitle}>{data.period} · {data.issuer}</Text>
      <View style={styles.summary}>
        <View><Text style={styles.summaryLabel}>TOTAL PENDIENTE CONFIRMADO</Text><Text style={styles.summaryValue}>{formatCurrency(data.totalDue)}</Text></View>
        <View><Text style={styles.summaryLabel}>RECIBOS DEL PERIODO</Text><Text style={styles.summaryValue}>{data.rows.length}</Text></View>
      </View>
      <View style={styles.table}>
        <View style={[styles.row, styles.header]} fixed>
          <Text style={styles.address}>DIRECCIÓN / UNIDAD</Text><Text style={styles.tenant}>INQUILINO</Text><Text style={styles.amount}>CANTIDAD A DEBER</Text><Text style={styles.dueDate}>VENCIMIENTO</Text><Text style={styles.status}>ESTATUS</Text>
        </View>
        {data.rows.map((row) => <View key={row.id} style={styles.row} wrap={false}>
          <Text style={styles.address}>{row.address} · Unidad {row.unit}</Text>
          <Text style={styles.tenant}>{row.tenant}</Text>
          <Text style={[styles.amount, row.status === "REVISION" || row.status === "OMITIDO" ? styles.muted : {}]}>{formatCurrency(row.amountDue)}</Text>
          <Text style={styles.dueDate}>{formatDate(row.dueDate)}</Text>
          <Text style={[styles.status, row.status === "REVISION" || row.status === "OMITIDO" ? styles.muted : {}]}>{statusLabel(row.status)}</Text>
        </View>)}
      </View>
      <Text style={styles.footer} fixed>Resumen administrativo de cobranza. Los importes en revisión u omitidos no se incluyen en el total pendiente confirmado.</Text>
      <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}

function statusLabel(status: string) {
  return ({ PENDIENTE: "Pendiente", VENCIDO: "Vencido", PAGADO: "Pagado", REVISION: "En revisión", OMITIDO: "Omitido" } as Record<string, string>)[status] ?? status;
}
