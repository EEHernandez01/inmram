import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1C1917",
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.45,
    paddingHorizontal: 66,
    paddingTop: 72,
  },
  heading: { color: "#1E3A5F", fontFamily: "Helvetica-Bold", fontSize: 17, textAlign: "center" },
  folio: { color: "#57534E", fontSize: 9, marginTop: 7, textAlign: "center" },
  date: { marginTop: 40, textAlign: "right" },
  paragraph: { fontSize: 13, lineHeight: 1.55, marginTop: 48, textAlign: "justify" },
  emphasis: { fontFamily: "Helvetica-Bold" },
  dueDate: { fontFamily: "Helvetica-Bold", marginTop: 20 },
  closing: { marginTop: 20, textAlign: "justify" },
  signature: { marginTop: 64, width: 250 },
  signatureLine: { borderTopColor: "#1C1917", borderTopWidth: 1, paddingTop: 8, textAlign: "center" },
  signerRole: { color: "#57534E", fontSize: 10, marginTop: 3, textAlign: "center" },
  footer: { bottom: 38, color: "#57534E", fontSize: 8, left: 66, position: "absolute", right: 66, textAlign: "center" },
});

export type ReceiptPdfData = {
  issuer: string;
  folio: string;
  tenant: string;
  total: string;
  totalInWords: string;
  property: string;
  unit: string;
  rentalPeriod: string;
  issuedAt: string;
  dueDate: string;
};

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return <Document title={`Solicitud de pago ${data.folio}`} author={data.issuer}>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.heading}>SOLICITUD DE PAGO</Text>
      <Text style={styles.folio}>Folio {data.folio}</Text>
      <Text style={styles.date}>{data.issuedAt}</Text>
      <Text style={styles.paragraph}>
        Por medio de la presente, solicitamos al Sr. <Text style={styles.emphasis}>{data.tenant}</Text> realizar el pago de <Text style={styles.emphasis}>{data.total}</Text> ({data.totalInWords}) por concepto de renta correspondiente al periodo <Text style={styles.emphasis}>{data.rentalPeriod}</Text>, del departamento ubicado en <Text style={styles.emphasis}>{data.property}, departamento {data.unit}</Text>.
      </Text>
      <Text style={styles.dueDate}>Fecha límite de pago: {data.dueDate}</Text>
      <Text style={styles.closing}>Agradecemos realizar el pago a más tardar en la fecha indicada.</Text>
      <View style={styles.signature}>
        <Text style={styles.signatureLine}>{data.issuer}</Text>
        <Text style={styles.signerRole}>Administración de rentas</Text>
      </View>
      <Text style={styles.footer}>Solicitud administrativa de pago. No es CFDI ni comprobante fiscal.</Text>
    </Page>
  </Document>;
}
