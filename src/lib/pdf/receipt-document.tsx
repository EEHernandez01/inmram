import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1C1917",
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.45,
    paddingHorizontal: 66,
    paddingTop: 120,
  },
  date: { fontSize: 12 },
  paragraph: { fontSize: 13, lineHeight: 1.55, marginHorizontal: 42, marginTop: 72, textAlign: "justify" },
  emphasis: { fontFamily: "Helvetica-Bold" },
  signature: { marginTop: 70, width: 250 },
  salutation: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 3 },
  signatureSpace: { height: 56 },
  signer: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  signerRole: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 8 },
});

export type ReceiptPdfData = {
  issuer: string;
  tenant: string;
  total: string;
  totalInWords: string;
  property: string;
  unit: string;
  rentalPeriod: string;
  issuedAt: string;
};

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return <Document title="Recibo" author={data.issuer}>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.date}>{data.issuedAt}</Text>
      <Text style={styles.paragraph}>
        Recibí del Sr. <Text style={styles.emphasis}>{data.tenant}</Text> la cantidad de <Text style={styles.emphasis}>{data.total}</Text> ({data.totalInWords}) por concepto de renta <Text style={styles.emphasis}>{data.rentalPeriod}</Text>, del departamento ubicado en <Text style={styles.emphasis}>{data.property}, departamento {data.unit}</Text>.
      </Text>
      <View style={styles.signature}>
        <Text style={styles.salutation}>ATENTAMENTE</Text>
        <View style={styles.signatureSpace} />
        <Text style={styles.signer}>{data.issuer}</Text>
        <Text style={styles.signerRole}>Apoderado Legal</Text>
      </View>
    </Page>
  </Document>;
}
