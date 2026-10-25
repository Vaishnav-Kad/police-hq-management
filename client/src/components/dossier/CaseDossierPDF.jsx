import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    lineHeight: 1.4,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  titleGov: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4b5563',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleHQ: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  titleSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  badgeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 130,
    fontWeight: 'bold',
    color: '#4b5563',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#111827',
    fontSize: 9,
  },
  hashText: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#065f46',
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
  },
});

export function CaseDossierDocument({ caseData }) {
  const c = caseData || {
    case_number: 'CASE-2026-001',
    fir_number: 'FIR-2026-001',
    crime_type: 'Armed Robbery & Dacoity (IPC 395/397)',
    station_name: 'Mumbai HQ & Azad Maidan (Station #1)',
    priority: 'Critical',
    case_status: 'In Court',
    assigned_officer_name: 'PSI Sachin Sawant',
    assigned_officer_badge: 'MH-MUM-2031',
    days_active: 285,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleGov}>Government of Maharashtra • Home Department</Text>
          <Text style={styles.titleHQ}>Maharashtra State Police Headquarters</Text>
          <Text style={styles.titleSub}>
            OFFICIAL INVESTIGATION CASE DOSSIER • CONFIDENTIAL LAW ENFORCEMENT RECORD
          </Text>
        </View>

        {/* Reference Strip */}
        <View style={styles.badgeStrip}>
          <Text style={styles.badgeText}>CASE: {c.case_number}</Text>
          <Text style={styles.badgeText}>FIR: {c.fir_number || 'Linked'}</Text>
          <Text style={styles.badgeText}>STAGE: {c.case_status}</Text>
          <Text style={styles.badgeText}>PRIORITY: {c.priority}</Text>
        </View>

        {/* Section 1: Offense Classification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Incident Particulars & Statutory Charges</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Crime Classification:</Text>
            <Text style={styles.value}>{c.crime_type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Precinct Jurisdiction:</Text>
            <Text style={styles.value}>{c.station_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Investigation:</Text>
            <Text style={styles.value}>{c.days_active} Days since registration</Text>
          </View>
        </View>

        {/* Section 2: Investigating Officers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Assigned Law Enforcement Personnel</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Investigating Officer:</Text>
            <Text style={styles.value}>{c.assigned_officer_name || 'Unassigned'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Officer Badge Number:</Text>
            <Text style={styles.value}>{c.assigned_officer_badge || 'MH-MUM-2031'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Supervisory Authority:</Text>
            <Text style={styles.value}>Office of Additional Commissioner of Police (HQ)</Text>
          </View>
        </View>

        {/* Section 3: Accused & Suspects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Accused & Suspect Particulars</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Primary Accused:</Text>
            <Text style={styles.value}>Raju Gaikwad (Alias: "Chhota Raju")</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Identification Marks:</Text>
            <Text style={styles.value}>
              Trident (Trishul) tattoo on right wrist, deep scar near left ear.
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Custody Status:</Text>
            <Text style={styles.value}>Judicial Custody (Azad Maidan Lockup Cell 2 - Bail Denied)</Text>
          </View>
        </View>

        {/* Section 4: Impounded Evidence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Impounded Malkhana Evidence (SHA-256 Ledger)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Exhibit #1:</Text>
            <Text style={styles.value}>EVD-2026-001: Country-made 7.65mm pistol (3 live rounds)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SHA-256 Checksum:</Text>
            <Text style={styles.hashText}>
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (VERIFIED)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Storage Location:</Text>
            <Text style={styles.value}>Ballistics Locker B-104 (Azad Maidan Vault)</Text>
          </View>
        </View>

        {/* Section 5: Court Proceedings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Court Proceedings & Judicial Decisions</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Designated Court:</Text>
            <Text style={styles.value}>City Civil & Sessions Court Fort, Courtroom 14</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Presiding Judge:</Text>
            <Text style={styles.value}>Hon. Addl. Sessions Judge R. K. Joshi</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Next Hearing Date:</Text>
            <Text style={styles.value}>25 October 2026 (Forensic ballistics admissibility)</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by PHDMS v2.0 • Security Clearance Verified</Text>
          <Text>Signature of Investigating Officer: ____________________</Text>
        </View>
      </Page>
    </Document>
  );
}

export function DownloadDossierButton({ caseData }) {
  const fileName = `${caseData?.case_number || 'CASE'}_Official_Dossier.pdf`;

  return (
    <PDFDownloadLink
      document={<CaseDossierDocument caseData={caseData} />}
      fileName={fileName}
      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow inline-flex items-center space-x-1.5"
    >
      {({ blob, url, loading, error }) => (
        <>
          <Download className="w-3.5 h-3.5" />
          <span>{loading ? 'Compiling PDF...' : 'Export Official Dossier (PDF)'}</span>
        </>
      )}
    </PDFDownloadLink>
  );
}
