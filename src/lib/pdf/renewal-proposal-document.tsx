import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const navy = "#1E3A5F";
const slate = "#57534E";

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#292524", fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.55, padding: 48 },
  header: { borderBottomColor: navy, borderBottomWidth: 3, paddingBottom: 14 },
  brand: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 17 },
  subtitle: { color: slate, fontSize: 9, marginTop: 4 },
  title: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 15, marginTop: 25 },
  date: { color: slate, fontSize: 10, marginTop: 8 },
  greeting: { marginTop: 24 },
  paragraph: { marginTop: 13 },
  summary: { backgroundColor: "#EEF3F8", borderLeftColor: navy, borderLeftWidth: 4, marginTop: 20, padding: 14 },
  label: { color: slate, fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  value: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 3 },
  detail: { color: slate, fontSize: 9, marginTop: 7 },
  signature: { marginTop: 34 },
  signer: { color: navy, fontFamily: "Helvetica-Bold", marginTop: 4 },
  footer: { bottom: 30, color: slate, fontSize: 8, left: 48, position: "absolute", right: 48, textAlign: "center" },
});

export type RenewalProposalPdfData = {
  tenant: string;
  property: string;
  unit: string;
  preparedDate: string;
  currentRent: string;
  inflation: string;
  proposedRent: string;
  proposedRentWords: string;
  renewalStart: string;
  renewalEnd: string;
  paymentNote?: string;
};

export function RenewalProposalDocument({ data }: { data: RenewalProposalPdfData }) {
  return <Document title={`Propuesta de renovación - ${data.tenant}`} author="Fernando S. Ramos Suárez">
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}><Text style={styles.brand}>Administración de rentas</Text><Text style={styles.subtitle}>Propuesta de renovación de contrato de arrendamiento</Text></View>
      <Text style={styles.title}>Propuesta de renovación por actualización INPC</Text><Text style={styles.date}>{data.preparedDate}</Text>
      <Text style={styles.greeting}>Buenos días, {data.tenant}:</Text>
      <Text style={styles.paragraph}>Espero que estés bien de salud tú y tu familia.</Text>
      <Text style={styles.paragraph}>Te compartimos la propuesta de renovación del contrato de arrendamiento por un año más, para el inmueble ubicado en {data.property}, unidad {data.unit}. La vigencia propuesta sería del {data.renewalStart} al {data.renewalEnd}.{data.paymentNote ? ` ${data.paymentNote}` : ""}</Text>
      <Text style={styles.paragraph}>De acuerdo con el contrato de arrendamiento anteriormente firmado, corresponde una revisión anual con base en la inflación. Para esta propuesta se aplicó la variación anual disponible del Índice Nacional de Precios al Consumidor (INPC).</Text>
      <View style={styles.summary}>
        <Text style={styles.label}>Renta mensual actual</Text><Text style={styles.value}>{data.currentRent}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Variación anual INPC aplicada</Text><Text style={styles.value}>{data.inflation}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Renta mensual propuesta</Text><Text style={styles.value}>{data.proposedRent}</Text><Text style={styles.detail}>{data.proposedRentWords}</Text>
      </View>
      <Text style={styles.paragraph}>Agradeceremos tu amable respuesta y, en caso de aceptar la propuesta, prepararemos la renovación correspondiente. De antemano, gracias.</Text>
      <View style={styles.signature}><Text>Saludos,</Text><Text style={styles.signer}>Fernando S. Ramos Suárez</Text></View>
      <Text style={styles.footer}>Documento administrativo de propuesta. No constituye un contrato ni comprobante fiscal.</Text>
    </Page>
  </Document>;
}
