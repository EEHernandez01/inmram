import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { addressIncludesUnit } from "@/lib/pdf/receipt-address";

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
  centeredDate: { fontSize: 12, marginBottom: 80, textAlign: "center" },
  content: { flexGrow: 1 },
  paragraph: { fontSize: 13, lineHeight: 1.55, textAlign: "justify" },
  centeredParagraph: { fontSize: 13, lineHeight: 1.55, textAlign: "center" },
  emphasis: { fontFamily: "Helvetica-Bold" },
  signature: { marginTop: 70, width: 250 },
  centeredSignature: { alignSelf: "center", marginTop: 70, width: 250 },
  salutation: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 3 },
  centeredSalutation: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 3, textAlign: "center" },
  signatureSpace: { height: 56 },
  signer: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  centeredSigner: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "center" },
  signerRole: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 8 },
  centeredSignerRole: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 8, textAlign: "center" },
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
  const unitIsInAddress = addressIncludesUnit(data.property, data.unit);
  return <Page size="LETTER" style={[styles.page, backgroundImage ? {} : styles.pageWithoutBackground]}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image does not accept alt text. */}
      {backgroundImage ? <Image fixed src={backgroundImage} style={styles.background} /> : null}
      <View style={styles.content}>
        <Text style={backgroundImage ? styles.date : styles.centeredDate}>{data.issuedAt}</Text>
        <Text style={backgroundImage ? styles.paragraph : styles.centeredParagraph}>
          Recibí del Sr. <Text style={styles.emphasis}>{data.tenant}</Text> la cantidad de <Text style={styles.emphasis}>{data.total}</Text> ({data.totalInWords}) por concepto de renta <Text style={styles.emphasis}>{data.rentalPeriod}</Text>, del inmueble ubicado en <Text style={styles.emphasis}>{data.property}{unitIsInAddress ? "" : `, departamento ${data.unit}`}</Text>.
        </Text>
        <View style={backgroundImage ? styles.signature : styles.centeredSignature}>
          <Text style={backgroundImage ? styles.salutation : styles.centeredSalutation}>Fernando Ramos Suarez</Text>
          <View style={styles.signatureSpace} />
          <Text style={backgroundImage ? styles.signer : styles.centeredSigner}>{data.owner}</Text>
          <Text style={backgroundImage ? styles.signerRole : styles.centeredSignerRole}>Administrador</Text>
        </View>
      </View>
    </Page>;
}
