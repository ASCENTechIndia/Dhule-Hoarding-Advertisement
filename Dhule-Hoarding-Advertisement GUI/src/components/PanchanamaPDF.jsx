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

// Register font
Font.register({
  family: "NotoSansDevanagari",
  src: "https://raw.githubusercontent.com/openmaptiles/fonts/master/noto-sans/NotoSansDevanagari-Regular.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "NotoSansDevanagari",
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
  gap: 6,
  marginTop: 6,
},

photoItem: {
  width: "22%",
  marginRight: "2%",
  marginBottom: 8,
},

photoImage: {
  width: "100%",
  height: 90,
  objectFit: "cover",
  borderRadius: 3,
},

photoLabel: {
  fontSize: 7,
  textAlign: "center",
  marginTop: 2,
  color: "#666",
},
});

export const PanchanamaPDF = ({ data }) => {
  const {
    master,
    details = [],
    demolitionDetails = [],
    photos = [],
  } = data;

  // =========================================================
  // DATE FORMAT
  // =========================================================

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

  // =========================================================
  // MARATHI FIELD LABELS
  // =========================================================

  const fieldLabels = {
    VAR_ILLEGALHOARD_PANCHANAMA_NO: "पंचनामा क्रमांक",

    DAT_CAP_DT: "वेळ",

    VAR_CAP_TIME: "दिनांक",

    VAR_USER1: "पंचनामा करणाऱ्याचे नाव",

    VAR_USER1_POST: "पंचनामा करणाऱ्याचे पद",

    VAR_ILLEGALHOARD_ADD:
      "अनधिकृत जाहिरात लावलेल्या ठिकाणाचा संपूर्ण पत्ता",

    DAT_FROM_DT:
      "जाहिरात फलक केव्हापासून अनधिकृतपणे प्रदर्शित केला आहे ?",

    NUM_SIZE_LENGTH: "लांबी",

    NUM_SIZE_WIDTH: "रुंदी",

    VAR_ILLEGALHOARD_WARD: "प्रभाग क्रमांक",

    BLOB_NEAR_PHOTO: "जवळून फोटो",

    BLOB_FAR_PHOTO: "दुरून फोटो",

    BLOB_USER_PHOTO: "पंचनामा करणाऱ्यासोबत फोटो",
  };

  // =========================================================
  // SKIP FIELDS
  // =========================================================

  const skipFields = [
    "NUM_ILLEGALHOARD_ID",
    "NUM_ILLEGALHOARD_ULBID",
    "LATITUDE",
    "LONGITUDE",
  ];

  // =========================================================
  // FORMAT LABEL
  // =========================================================

  const formatLabel = (key) => {
    return (
      fieldLabels[key] ||
      key
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  // =========================================================
  // GET TEXT ENTRIES
  // =========================================================

  const getTextEntries = (obj) => {
    return Object.entries(obj || {}).filter(([key, value]) => {
      const upperKey = key.toUpperCase();

      // Skip BLOB fields
      if (upperKey.startsWith("BLOB_")) {
        return false;
      }

      // Skip system/location fields
      if (skipFields.includes(upperKey)) {
        return false;
      }

      // Skip empty values
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return false;
      }

      return true;
    });
  };

  const textEntries = getTextEntries(master);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <Text style={styles.header}>
          पंचनामा माहिती
        </Text>

        {/* ================================================= */}
        {/* MASTER INFORMATION */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          पंचनामा माहिती
        </Text>

        <View style={styles.grid}>
          {textEntries.map(([key, value]) => {
            let displayValue = value;

            // Date fields
            if (
              key.toUpperCase().includes("DAT_") ||
              key.toUpperCase().includes("DATE")
            ) {
              displayValue = formatDate(value);
            }

            // Object values
            if (
              typeof displayValue === "object" &&
              displayValue !== null
            ) {
              try {
                displayValue = JSON.stringify(displayValue);
              } catch {
                displayValue = String(displayValue);
              }
            }

            return (
              <View style={styles.gridItem} key={key}>
                <Text style={styles.label}>
                  {formatLabel(key)}
                </Text>

                <Text style={styles.value}>
                  {String(displayValue)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ================================================= */}
        {/* DETAILS */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          सोबत उपस्थित कर्मचाऱ्यांचे नाव
        </Text>

        {details.length > 0 ? (
          <View style={styles.table}>

            <View
              style={[
                styles.tableRow,
                styles.tableHeader,
              ]}
            >
              <Text style={styles.tableCell}>
                अनुक्रमांक
              </Text>

              <Text style={styles.tableCell}>
                कर्मचाऱ्याचे नाव
              </Text>

              <Text style={styles.tableCell}>
                कर्मचाऱ्याचे पद
              </Text>
            </View>

            {details.map((item, index) => (
              <View
                style={styles.tableRow}
                key={
                  item.NUM_ILLEGALHOARDDET_ID ||
                  index
                }
              >
                <Text style={styles.tableCell}>
                  {index + 1}
                </Text>

                <Text style={styles.tableCell}>
                  {item.VAR_USER || "-"}
                </Text>

                <Text style={styles.tableCell}>
                  {item.VAR_USER_POST || "-"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>
            पंचनामा तपशील उपलब्ध नाही.
          </Text>
        )}

        {/* ================================================= */}
        {/* DEMOLITION DETAILS */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          जाहिरात फलक प्रदर्शित करणाऱ्याचे नाव
        </Text>

        {demolitionDetails.length > 0 ? (
          <View style={styles.table}>

            <View
              style={[
                styles.tableRow,
                styles.tableHeader,
              ]}
            >
              <Text style={styles.tableCell}>
                अनुक्रमांक
              </Text>

              <Text style={styles.tableCell}>
                नाव
              </Text>
            </View>

            {demolitionDetails.map((item, index) => (
              <View
                style={styles.tableRow}
                key={
                  item.NUM_ILLHOARD_DEMON_ID ||
                  index
                }
              >
                <Text style={styles.tableCell}>
                  {index + 1}
                </Text>

                <Text style={styles.tableCell}>
                  {item.VAR_DEMONSTARTED_NAME || "-"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>
            जाहिरात फलक प्रदर्शित करणाऱ्याची माहिती उपलब्ध नाही.
          </Text>
        )}

        {/* ================================================= */}
        {/* PHOTOS */}
        {/* ================================================= */}

        <Text style={styles.sectionTitle}>
          पंचनाम्याचे फोटो
        </Text>

        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => {

              // Supports both formats:
              // 1. { image, label }
              // 2. base64 string

              const image =
                typeof photo === "string"
                  ? photo
                  : photo?.image;

              const label =
                typeof photo === "object" &&
                photo?.label
                  ? photo.label
                  : index === 0
                    ? "जवळून फोटो"
                    : index === 1
                      ? "दुरून फोटो"
                      : "पंचनामा करणाऱ्यासोबत फोटो";

              if (!image) {
                return null;
              }

              return (
                <View
                  style={styles.photoItem}
                  key={index}
                >
                  <Image
                    src={`data:image/jpeg;base64,${image}`}
                    style={styles.photoImage}
                  />

                  <Text style={styles.photoLabel}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text>
            फोटो उपलब्ध नाहीत.
          </Text>
        )}

      </Page>
    </Document>
  );
};