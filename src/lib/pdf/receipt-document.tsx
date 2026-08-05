import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#1C1917", fontFamily: "Helvetica", fontSize: 10, padding: 42 },
  header: { borderBottomColor: "#1E3A5F", borderBottomWidth: 2, flexDirection: "row", justifyContent: "space-between", paddingBottom: 16 },
  brand: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 18 },
  muted: { color: "#78716C", fontSize: 9, marginTop: 4 },
  title: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 14, textAlign: "right" },
  section: { borderBottomColor: "#E7E5E4", borderBottomWidth: 1, paddingBottom: 14, paddingTop: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  label: { color: "#78716C" },
  value: { fontFamily: "Helvetica-Bold", textAlign: "right" },
  total: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 16 },
  footer: { bottom: 34, color: "#78716C", fontSize: 8, left: 42, position: "absolute", right: 42, textAlign: "center" },
});

export type ReceiptPdfData = {
  issuer: string; folio: string; period: string; tenant: string; property: string; unit: string;
  rent: string; water: string; total: string; status: string; dueDate: string; paymentDate?: string; paymentMethod?: string;
};

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return <Document title={`Recibo administrativo ${data.period}`} author={data.issuer}>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}><View><Text style={styles.brand}>{data.issuer}</Text><Text style={styles.muted}>Administración de rentas</Text></View><View><Text style={styles.title}>RECIBO ADMINISTRATIVO</Text><Text style={[styles.muted, { textAlign: "right" }]}>Folio {data.folio}</Text></View></View>
      <View style={styles.section}><View style={styles.row}><Text style={styles.label}>Periodo</Text><Text style={styles.value}>{data.period}</Text></View><View style={styles.row}><Text style={styles.label}>Arrendatario</Text><Text style={styles.value}>{data.tenant}</Text></View><View style={styles.row}><Text style={styles.label}>Propiedad</Text><Text style={styles.value}>{data.property}</Text></View><View style={styles.row}><Text style={styles.label}>Unidad</Text><Text style={styles.value}>{data.unit}</Text></View><View style={styles.row}><Text style={styles.label}>Fecha límite</Text><Text style={styles.value}>{data.dueDate}</Text></View></View>
      <View style={styles.section}><View style={styles.row}><Text style={styles.label}>Renta mensual</Text><Text style={styles.value}>{data.rent}</Text></View><View style={styles.row}><Text style={styles.label}>Cargo de agua</Text><Text style={styles.value}>{data.water}</Text></View><View style={[styles.row, { marginTop: 14 }]}><Text style={styles.total}>Total</Text><Text style={styles.total}>{data.total}</Text></View></View>
      <View style={styles.section}><View style={styles.row}><Text style={styles.label}>Estado</Text><Text style={styles.value}>{data.status}</Text></View>{data.paymentDate ? <View style={styles.row}><Text style={styles.label}>Pago registrado</Text><Text style={styles.value}>{data.paymentDate}{data.paymentMethod ? ` - ${data.paymentMethod}` : ""}</Text></View> : null}</View>
      <Text style={styles.footer}>Este documento es un comprobante administrativo de control interno. No es CFDI ni comprobante fiscal.</Text>
    </Page>
  </Document>;
}
