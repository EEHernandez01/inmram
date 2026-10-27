import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const navy = "#1E3A5F";
const slate = "#57534E";

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#1C1917", fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.45, paddingHorizontal: 66, paddingTop: 72 },
  heading: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 17, textAlign: "center" },
  date: { color: slate, fontSize: 10, marginTop: 38, textAlign: "right" },
  greeting: { fontSize: 13, marginTop: 40 },
  paragraph: { fontSize: 13, lineHeight: 1.55, marginTop: 18, textAlign: "justify" },
  emphasis: { fontFamily: "Helvetica-Bold" },
  proposedRent: { color: navy, fontFamily: "Helvetica-Bold" },
  signature: { marginTop: 64, width: 250 },
  signatureLine: { borderTopColor: "#1C1917", borderTopWidth: 1, paddingTop: 8, textAlign: "center" },
  signerRole: { color: slate, fontSize: 10, marginTop: 3, textAlign: "center" },
  footer: { bottom: 38, color: slate, fontSize: 8, left: 66, position: "absolute", right: 66, textAlign: "center" },
});

export type RenewalProposalPdfData = {
  tenant: string;
  signer: string;
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
  isPreview?: boolean;
};

export function RenewalProposalDocument({ data }: { data: RenewalProposalPdfData }) {
  return <Document title={`${data.isPreview ? "Vista previa de propuesta de renovación" : "Propuesta de renovación"} - ${data.tenant}`} author={data.signer}>
    <Page size="LETTER" style={styles.page}>
      {!data.isPreview ? <Text style={styles.heading}>PROPUESTA DE RENOVACIÓN DE RENTA</Text> : null}
      <Text style={styles.date}>{data.preparedDate}</Text>
      <Text style={styles.greeting}>Estimado(a) {data.tenant}:</Text>
      <Text style={styles.paragraph}>
        Esperamos que tú y tu familia se encuentren muy bien. Te compartimos la propuesta para renovar por un año el contrato de arrendamiento del inmueble ubicado en <Text style={styles.emphasis}>{data.property}, unidad {data.unit}</Text>. La nueva vigencia sería del <Text style={styles.emphasis}>{data.renewalStart}</Text> al <Text style={styles.emphasis}>{data.renewalEnd}</Text>.{data.paymentNote ? ` ${data.paymentNote}` : ""}
      </Text>
      <Text style={styles.paragraph}>
        Conforme a la revisión anual de la inflación prevista en el contrato, la renta mensual actual de <Text style={styles.emphasis}>{data.currentRent}</Text> se actualizaría en <Text style={styles.emphasis}>{data.inflation}</Text> a <Text style={styles.proposedRent}>{data.proposedRent}</Text> ({data.proposedRentWords}).
      </Text>
      <Text style={styles.paragraph}>
        Agradeceremos tu respuesta. En caso de aceptar la propuesta, prepararemos la renovación correspondiente.
      </Text>
      <View style={styles.signature}>
        <Text style={styles.signatureLine}>{data.signer}</Text>
        <Text style={styles.signerRole}>Apoderado legal</Text>
      </View>
      {!data.isPreview ? <Text style={styles.footer}>Propuesta administrativa de renovación. No constituye un contrato ni comprobante fiscal.</Text> : null}
    </Page>
  </Document>;
}
