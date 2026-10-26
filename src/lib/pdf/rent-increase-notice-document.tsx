import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const navy = "#1E3A5F";
const slate = "#57534E";

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#292524", fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.6, padding: 48 },
  header: { borderBottomColor: navy, borderBottomWidth: 3, paddingBottom: 14 },
  brand: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 17 },
  subtitle: { color: slate, fontSize: 9, marginTop: 4 },
  title: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 15, marginTop: 25 },
  date: { color: slate, fontSize: 10, marginTop: 8 },
  paragraph: { marginTop: 16 },
  summary: { backgroundColor: "#EEF3F8", borderLeftColor: navy, borderLeftWidth: 4, marginTop: 22, padding: 14 },
  label: { color: slate, fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  value: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 3 },
  detail: { color: slate, fontSize: 9, marginTop: 6 },
  signature: { marginTop: 38 },
  signer: { color: navy, fontFamily: "Helvetica-Bold", marginTop: 4 },
  footer: { bottom: 30, color: slate, fontSize: 8, left: 48, position: "absolute", right: 48, textAlign: "center" },
});

export type RentIncreaseNoticePdfData = {
  tenant: string;
  property: string;
  unit: string;
  currentRent: string;
  newRent: string;
  newRentWords: string;
  effectiveDate: string;
};

export function RentIncreaseNoticeDocument({ data }: { data: RentIncreaseNoticePdfData }) {
  return <Document title={`Aviso de actualización de renta - ${data.tenant}`} author="Fernando S. Ramos Suárez">
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}><Text style={styles.brand}>Administración de rentas</Text><Text style={styles.subtitle}>Notificación de actualización anual de renta</Text></View>
      <Text style={styles.title}>Aviso de actualización anual de renta</Text>
      <Text style={styles.date}>Fecha de notificación: ____________________</Text>
      <Text style={styles.paragraph}>A {data.tenant}:</Text>
      <Text style={styles.paragraph}>Por medio de la presente, le notificamos la actualización de la renta mensual correspondiente al inmueble ubicado en {data.property}, unidad {data.unit}, conforme a lo establecido en el contrato de arrendamiento.</Text>
      <View style={styles.summary}>
        <Text style={styles.label}>Renta mensual actual</Text><Text style={styles.value}>{data.currentRent}</Text>
        <Text style={[styles.label, { marginTop: 14 }]}>Nueva renta mensual</Text><Text style={styles.value}>{data.newRent}</Text><Text style={styles.detail}>{data.newRentWords}</Text>
        <Text style={[styles.label, { marginTop: 14 }]}>Vigencia de la nueva renta</Text><Text style={styles.value}>{data.effectiveDate}</Text>
      </View>
      <Text style={styles.paragraph}>Agradecemos su atención y puntualidad en los pagos.</Text>
      <View style={styles.signature}><Text>Atentamente,</Text><Text style={styles.signer}>Fernando S. Ramos Suárez</Text><Text>Administración de rentas</Text></View>
      <Text style={styles.footer}>Aviso de actualización de renta correspondiente al contrato de arrendamiento.</Text>
    </Page>
  </Document>;
}
