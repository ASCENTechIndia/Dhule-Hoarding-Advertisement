import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register a font
Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: "2 solid #333",
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    padding: 6,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridItem: {
    width: "50%",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 10,
    color: "#737887",
    fontWeight: 600,
  },
  value: {
    fontSize: 12,
    color: "#252525",
    marginTop: 2,
  },
  table: {
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderBottomStyle: "solid",
  },
  tableHeader: {
    backgroundColor: "#f8f8f8",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    flex: 1,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  photoItem: {
    width: "30%",
    marginRight: "3%",
    marginBottom: 10,
  },
  photoImage: {
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: 4,
  },
  photoLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    color: "#666",
  },
});

export const PanchanamaPDF = ({ data }) => {
  const { master, details, demolitionDetails, photos } = data;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date
      .toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " - ");
  };

  const fieldLabels = {
    NUM_ILLEGALHOARD_ID: "Panchanama ID",
    NUM_ILLEGALHOARD_ULBID: "ULB ID",
    DAT_CAP_DT: "Capture Date",
    VAR_CAP_TIME: "Capture Time",
    VAR_USER1: "User Name",
    VAR_USER1_POST: "User Post",
    VAR_ILLEGALHOARD_ADD: "Address",
    DAT_FROM_DT: "From Date",
    NUM_SIZE_LENGTH: "Length",
    NUM_SIZE_WIDTH: "Width",
    LATITUDE: "Latitude",
    LONGITUDE: "Longitude",
    VAR_ILLEGALHOARD_WARD: "Ward",
    VAR_ILLEGALHOARD_PANCHANAMA_NO: "Panchanama No.",
  };

  // Filter out BLOB fields for text display
  const getTextEntries = (obj) => {
    return Object.entries(obj).filter(
      ([key, value]) =>
        !key.toUpperCase().startsWith("BLOB_") &&
        value !== null &&
        value !== undefined &&
        value !== "",
    );
  };

  const textEntries = getTextEntries(master);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.header}>Panchanama Details</Text>
        <Text style={{ fontSize: 12, marginBottom: 12 }}>
          Panchanama ID: {master.NUM_ILLEGALHOARD_ID || "-"}
        </Text>

        {/* Master Information */}
        <Text style={styles.sectionTitle}>Panchanama Information</Text>
        <View style={styles.grid}>
          {textEntries.map(([key, value]) => {
            let displayValue = value;
            if (
              key.toUpperCase().includes("DAT_") ||
              key.toUpperCase().includes("DATE")
            ) {
              displayValue = formatDate(value);
            }
            return (
              <View style={styles.gridItem} key={key}>
                <Text style={styles.label}>
                  {fieldLabels[key] || key.replace(/_/g, " ")}
                </Text>
                <Text style={styles.value}>{displayValue}</Text>
              </View>
            );
          })}
        </View>

        {/* Details List */}
        <Text style={styles.sectionTitle}>
          Panchanama Details ({details.length})
        </Text>
        {details.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Sr. No.</Text>
              <Text style={styles.tableCell}>Detail ID</Text>
              <Text style={styles.tableCell}>User</Text>
              <Text style={styles.tableCell}>User Post</Text>
            </View>
            {details.map((item, idx) => (
              <View
                style={styles.tableRow}
                key={item.NUM_ILLEGALHOARDDET_ID || idx}
              >
                <Text style={styles.tableCell}>{idx + 1}</Text>
                <Text style={styles.tableCell}>
                  {item.NUM_ILLEGALHOARDDET_ID || "-"}
                </Text>
                <Text style={styles.tableCell}>{item.VAR_USER || "-"}</Text>
                <Text style={styles.tableCell}>
                  {item.VAR_USER_POST || "-"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>No Panchanama details available.</Text>
        )}

        {/* Demolition Details */}
        <Text style={styles.sectionTitle}>
          Demolition Details ({demolitionDetails.length})
        </Text>
        {demolitionDetails.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Sr. No.</Text>
              <Text style={styles.tableCell}>Demolition ID</Text>
              <Text style={styles.tableCell}>Started By</Text>
            </View>
            {demolitionDetails.map((item, idx) => (
              <View
                style={styles.tableRow}
                key={item.NUM_ILLHOARD_DEMON_ID || idx}
              >
                <Text style={styles.tableCell}>{idx + 1}</Text>
                <Text style={styles.tableCell}>
                  {item.NUM_ILLHOARD_DEMON_ID || "-"}
                </Text>
                <Text style={styles.tableCell}>
                  {item.VAR_DEMONSTARTED_NAME || "-"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>No demolition details available.</Text>
        )}

        {/* Photos */}
        <Text style={styles.sectionTitle}>
          Panchanama Photos ({photos.length})
        </Text>
        <View style={styles.photoGrid}>
          {photos.map((img, idx) => (
            <View style={styles.photoItem} key={idx}>
              <Image
                src={`data:image/jpeg;base64,${img}`}
                style={styles.photoImage}
              />
              <Text style={styles.photoLabel}>
                {idx === 0
                  ? "Near Photo"
                  : idx === 1
                    ? "Far Photo"
                    : "User Photo"}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
