import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const navy = "#1E3A5F";
const slate = "#57534E";
const line = "#DDD8D2";

function singleLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#292524", fontFamily: "Helvetica", fontSize: 10, padding: 42 },
  header: { borderBottomColor: navy, borderBottomWidth: 3, flexDirection: "row", justifyContent: "space-between", paddingBottom: 17 },
  brand: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 18 },
  muted: { color: slate, fontSize: 9, marginTop: 4 },
  receiptType: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 14, textAlign: "right" },
  folio: { color: slate, fontSize: 9, marginTop: 5, textAlign: "right" },
  accountBanner: { backgroundColor: "#EEF3F8", flexDirection: "row", justifyContent: "space-between", marginTop: 18, padding: 14 },
  eyebrow: { color: "#64748B", fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  bannerTitle: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 4 },
  dueValue: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 4, textAlign: "right" },
  section: { borderBottomColor: line, borderBottomWidth: 1, paddingBottom: 16, paddingTop: 16 },
  sectionTitle: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase" },
  propertyBox: { backgroundColor: "#F8F7F5", borderLeftColor: navy, borderLeftWidth: 4, marginTop: 9, padding: 12 },
  propertyAddress: { color: "#292524", fontFamily: "Helvetica-Bold", fontSize: 11, lineHeight: 1.35 },
  propertyMeta: { color: slate, fontSize: 9, marginTop: 7 },
  details: { flexDirection: "row", marginTop: 14 },
  detail: { width: "50%" },
  detailValue: { color: "#292524", fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 4 },
  chargeHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  chargeHeading: { color: slate, fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  charge: { borderBottomColor: "#EDE9E5", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 },
  chargeLabel: { color: slate },
  chargeValue: { fontFamily: "Helvetica-Bold" },
  totalBox: { backgroundColor: navy, flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingHorizontal: 14, paddingVertical: 13 },
  totalLabel: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 12 },
  totalValue: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 17 },
  footer: { bottom: 34, color: slate, fontSize: 8, left: 42, position: "absolute", right: 42, textAlign: "center" },
});

export type ReceiptPdfData = {
  issuer: string; folio: string; period: string; tenant: string; property: string; unit: string;
  rent: string; water: string; total: string; status: string; dueDate: string; paymentDate?: string; paymentMethod?: string;
};

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  const propertyAddress = singleLine(data.property);
  const unit = singleLine(data.unit);
  return <Document title={`Recibo administrativo ${data.period}`} author={data.issuer}>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <View><Text style={styles.brand}>{data.issuer}</Text><Text style={styles.muted}>Administración de rentas</Text></View>
        <View><Text style={styles.receiptType}>RECIBO ADMINISTRATIVO</Text><Text style={styles.folio}>Folio {data.folio}</Text></View>
      </View>
      <View style={styles.accountBanner}>
        <View><Text style={styles.eyebrow}>Resumen de cuenta</Text><Text style={styles.bannerTitle}>Periodo {data.period}</Text></View>
        <View><Text style={[styles.eyebrow, { textAlign: "right" }]}>Fecha límite de pago</Text><Text style={styles.dueValue}>{data.dueDate}</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inmueble arrendado</Text>
        <View style={styles.propertyBox}><Text style={styles.propertyAddress}>{propertyAddress}</Text><Text style={styles.propertyMeta}>Unidad {unit}</Text></View>
        <View style={styles.details}>
          <View style={styles.detail}><Text style={styles.eyebrow}>Arrendatario</Text><Text style={styles.detailValue}>{data.tenant}</Text></View>
          <View style={styles.detail}><Text style={[styles.eyebrow, { textAlign: "right" }]}>Periodo facturado</Text><Text style={[styles.detailValue, { textAlign: "right" }]}>{data.period}</Text></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalle de cargos</Text>
        <View style={styles.chargeHeader}><Text style={styles.chargeHeading}>Concepto</Text><Text style={styles.chargeHeading}>Importe</Text></View>
        <View style={styles.charge}><Text style={styles.chargeLabel}>Renta mensual</Text><Text style={styles.chargeValue}>{data.rent}</Text></View>
        <View style={styles.totalBox}><Text style={styles.totalLabel}>Total a pagar</Text><Text style={styles.totalValue}>{data.total}</Text></View>
      </View>
      <Text style={styles.footer}>Este documento es un comprobante administrativo de control interno. No es CFDI ni comprobante fiscal.</Text>
    </Page>
  </Document>;
}
