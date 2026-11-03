import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1C1917",
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.45,
    paddingHorizontal: 66,
    paddingTop: 240,
  },
  pageWithoutBackground: { paddingTop: 72 },
  background: { height: 792, left: 0, position: "absolute", top: 0, width: 612, zIndex: -1 },
  date: { fontSize: 12, marginBottom: 80, textAlign: "right" },
  content: { flexGrow: 1 },
  paragraph: { fontSize: 13, lineHeight: 1.55, textAlign: "justify" },
  emphasis: { fontFamily: "Helvetica-Bold" },
  signature: { marginTop: 70, width: 250 },
  salutation: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 3 },
  signatureSpace: { height: 56 },
  signer: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  signerRole: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 8 },
});

export type ReceiptPdfData = {
  issuer: string;
  owner: string;
  tenant: string;
  total: string;
  totalInWords: string;
  property: string;
  unit: string;
  rentalPeriod: string;
  issuedAt: string;
};

export function ReceiptDocument({ data, backgroundImage }: { data: ReceiptPdfData; backgroundImage?: Buffer }) {
  return <Document title="Recibo" author={data.issuer}><ReceiptPage backgroundImage={backgroundImage} data={data} /></Document>;
}

export function ReceiptPage({ data, backgroundImage }: { data: ReceiptPdfData; backgroundImage?: Buffer }) {
  return <Page size="LETTER" style={[styles.page, backgroundImage ? {} : styles.pageWithoutBackground]}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image does not accept alt text. */}
      {backgroundImage ? <Image fixed src={backgroundImage} style={styles.background} /> : null}
      <View style={styles.content}>
        <Text style={styles.date}>{data.issuedAt}</Text>
        <Text style={styles.paragraph}>
          Recibí del Sr. <Text style={styles.emphasis}>{data.tenant}</Text> la cantidad de <Text style={styles.emphasis}>{data.total}</Text> ({data.totalInWords}) por concepto de renta <Text style={styles.emphasis}>{data.rentalPeriod}</Text>, del departamento ubicado en <Text style={styles.emphasis}>{data.property}, departamento {data.unit}</Text>.
        </Text>
        <View style={styles.signature}>
          <Text style={styles.salutation}>ATENTAMENTE</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signer}>{data.owner}</Text>
          <Text style={styles.signerRole}>Administrador</Text>
        </View>
      </View>
    </Page>;
}
