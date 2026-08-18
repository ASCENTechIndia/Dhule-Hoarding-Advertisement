import React, { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import "../../assets/css/form-validation.css";
import apiClient from "../../services/apiClient";
import ResponseModal from "../../components/ResponseModal";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";

function AdvertisementPanchnama() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();

  const showModal = (type, title, message) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getCurrentDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");

    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      panchnamaDate: getCurrentDate(),

      panchnamaTime: getCurrentTime(),

      officerName: loggedInUser?.firstName || "",
      officerDesignation: "सहाय्यक आयुक्त",

      wardNo: "",

      advertisementAddress: "",

      employees: [
        {
          name: "",
          designation: "",
        },
      ],

      witnessName: "",

      advertisementDisplayedBy: [
        {
          name: "",
        },
      ],

      permissionDate: "",

      width: "",

      height: "",
    },
  });

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({
    control,
    name: "employees",
  });

  const {
    fields: advertisementFields,
    append: appendAdvertisement,
    remove: removeAdvertisement,
  } = useFieldArray({
    control,
    name: "advertisementDisplayedBy",
  });

  const handleAddAdvertisement = () => {
    if (advertisementFields.length >= 5) {
      return;
    }

    appendAdvertisement({
      name: "",
    });
  };

  const fileRefs = useRef([]);

  const [photos, setPhotos] = useState([
    {
      file: null,
      preview: null,
      latitude: "",
      longitude: "",
    },
    {
      file: null,
      preview: null,
      latitude: "",
      longitude: "",
    },
    {
      file: null,
      preview: null,
      latitude: "",
      longitude: "",
    },
  ]);

  const [photoLoading, setPhotoLoading] = useState([false, false, false]);

  const [submitLoading, setSubmitLoading] = useState(false);

  // ---------------------------------------------------------
  // Add Employee
  // ---------------------------------------------------------

  const handleAddEmployee = () => {
    if (employeeFields.length >= 5) {
      return;
    }

    appendEmployee({
      name: "",
      designation: "",
    });
  };

  // ---------------------------------------------------------
  // Open Camera / File
  // ---------------------------------------------------------

  const openCamera = (index) => {
    if (fileRefs.current[index]) {
      fileRefs.current[index].click();
    }
  };

  // ---------------------------------------------------------
  // Get Current Location
  // ---------------------------------------------------------

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("आपल्या ब्राउझरमध्ये Location सुविधा उपलब्ध नाही."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  };

  // ---------------------------------------------------------
  // Get Address from Coordinates
  // Optional Reverse Geocoding
  // ---------------------------------------------------------

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        return "";
      }

      const data = await response.json();

      return data.display_name || "";
    } catch (error) {
      console.error("Reverse geocoding failed:", error);

      return "";
    }
  };

  // ---------------------------------------------------------
  // Convert File -> Image
  // ---------------------------------------------------------

  const loadImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();

        image.onload = () => {
          resolve(image);
        };

        image.onerror = reject;

        image.src = event.target.result;
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  };

  // ---------------------------------------------------------
  // Canvas Geo Tag
  // ---------------------------------------------------------

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB

  const canvasToBlob = (canvas, quality) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to create image"));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        quality,
      );
    });
  };

  const addGeoTagToImage = async ({
    file,
    latitude,
    longitude,
    address,
    index,
  }) => {
    // =====================================================
    // LOAD IMAGE
    // =====================================================

    const image = await loadImage(file);

    const originalWidth = image.width;
    const originalHeight = image.height;

    // =====================================================
    // RESPONSIVE SCALE
    // =====================================================

    const fontSize = Math.min(
      26,
      Math.max(12, Math.round(originalWidth * 0.015)),
    );

    // =====================================================
    // RESPONSIVE PADDING
    // =====================================================

    const padding = Math.min(
      40,
      Math.max(10, Math.round(originalWidth * 0.025)),
    );

    // =====================================================
    // LINE HEIGHT
    // =====================================================

    const lineHeight = Math.round(fontSize * 1.5);

    // =====================================================
    // DATE / TIME
    // =====================================================

    const currentDate = new Date();

    const dateText = currentDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const timeText = currentDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // =====================================================
    // LATITUDE / LONGITUDE
    // =====================================================

    const latitudeText = Number(latitude).toFixed(6);

    const longitudeText = Number(longitude).toFixed(6);

    // =====================================================
    // LOCATION
    // =====================================================

    const locationText = address || "GPS Location";

    // =====================================================
    // CREATE TEMP CANVAS
    // =====================================================

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    // =====================================================
    // TEXT CONFIGURATION
    // =====================================================

    ctx.font = `600 ${fontSize}px Arial`;

    ctx.textBaseline = "alphabetic";

    // =====================================================
    // AVAILABLE TEXT WIDTH
    // =====================================================

    const maxTextWidth = originalWidth - padding * 2;

    // =====================================================
    // TEXT WRAPPING
    // =====================================================

    const wrapText = (text, maxWidth) => {
      const words = String(text).trim().split(/\s+/);

      const lines = [];

      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);

          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    const locationLines = wrapText(`Location: ${locationText}`, maxTextWidth);

    // =====================================================
    // GEO SECTION HEIGHT
    // =====================================================

    const totalLines = 4 + locationLines.length;

    const geoSectionHeight = padding * 2 + totalLines * lineHeight + 10;

    // =====================================================
    // FUNCTION TO DRAW IMAGE
    // =====================================================

    const drawImageWithGeoTag = (targetWidth, targetHeight) => {
      const scale = targetWidth / originalWidth;

      const scaledImageHeight = originalHeight * scale;

      const scaledFontSize = Math.max(10, Math.round(fontSize * scale));

      const scaledPadding = Math.max(8, Math.round(padding * scale));

      const scaledLineHeight = Math.round(lineHeight * scale);

      const scaledGeoHeight = Math.round(geoSectionHeight * scale);

      // ---------------------------------------------
      // Canvas size
      // ---------------------------------------------

      canvas.width = Math.round(targetWidth);

      canvas.height = Math.round(scaledImageHeight + scaledGeoHeight);

      // ---------------------------------------------
      // White background
      // ---------------------------------------------

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ---------------------------------------------
      // Original image
      // ---------------------------------------------

      ctx.drawImage(image, 0, 0, targetWidth, scaledImageHeight);

      // ---------------------------------------------
      // Geo section
      // ---------------------------------------------

      const sectionY = scaledImageHeight;

      ctx.fillStyle = "#f5f5f5";

      ctx.fillRect(0, sectionY, canvas.width, scaledGeoHeight);

      // ---------------------------------------------
      // Top border
      // ---------------------------------------------

      ctx.fillStyle = "#333333";

      ctx.fillRect(
        0,
        sectionY,
        canvas.width,
        Math.max(1, Math.round(targetWidth * 0.002)),
      );

      // ---------------------------------------------
      // Text
      // ---------------------------------------------

      ctx.fillStyle = "#222222";

      ctx.font = `600 ${scaledFontSize}px Arial`;

      ctx.textBaseline = "alphabetic";

      let currentY = sectionY + scaledPadding + scaledFontSize;

      // ---------------------------------------------
      // Date
      // ---------------------------------------------

      ctx.fillText(`Date: ${dateText}`, scaledPadding, currentY);

      currentY += scaledLineHeight;

      // ---------------------------------------------
      // Time
      // ---------------------------------------------

      ctx.fillText(`Time: ${timeText}`, scaledPadding, currentY);

      currentY += scaledLineHeight;

      // ---------------------------------------------
      // Latitude
      // ---------------------------------------------

      ctx.fillText(`Latitude: ${latitudeText}`, scaledPadding, currentY);

      currentY += scaledLineHeight;

      // ---------------------------------------------
      // Longitude
      // ---------------------------------------------

      ctx.fillText(`Longitude: ${longitudeText}`, scaledPadding, currentY);

      currentY += scaledLineHeight;

      // ---------------------------------------------
      // Location
      // ---------------------------------------------

      locationLines.forEach((line) => {
        ctx.fillText(line, scaledPadding, currentY);

        currentY += scaledLineHeight;
      });
    };

    // =====================================================
    // COMPRESSION
    // =====================================================

    let targetWidth = originalWidth;

    let targetHeight = originalHeight;

    let quality = 0.85;

    const MIN_QUALITY = 0.35;

    const MIN_WIDTH = 800;

    let blob = null;

    while (true) {
      // ---------------------------------------------
      // Draw image
      // ---------------------------------------------

      drawImageWithGeoTag(targetWidth, targetHeight);

      // ---------------------------------------------
      // Convert to JPEG
      // ---------------------------------------------

      blob = await canvasToBlob(canvas, quality);

      // ---------------------------------------------
      // Debug information
      // ---------------------------------------------

      console.log(
        `Geo image: ${(blob.size / 1024 / 1024).toFixed(2)} MB | ` +
          `Quality: ${quality.toFixed(2)} | ` +
          `Resolution: ${Math.round(targetWidth)}x${Math.round(targetHeight)}`,
      );

      // =================================================
      // SUCCESS
      // =================================================

      if (blob.size <= MAX_IMAGE_SIZE) {
        break;
      }

      // =================================================
      // REDUCE QUALITY
      // =================================================

      if (quality > MIN_QUALITY) {
        quality -= 0.05;

        continue;
      }

      // =================================================
      // QUALITY LOW → REDUCE RESOLUTION
      // =================================================

      if (targetWidth > MIN_WIDTH) {
        targetWidth *= 0.85;

        targetHeight *= 0.85;

        quality = 0.7;

        continue;
      }

      // =================================================
      // FAILED
      // =================================================

      throw new Error("Unable to compress image below 1 MB");
    }

    // =====================================================
    // CREATE FINAL FILE
    // =====================================================

    const geoTaggedFile = new File(
      [blob],
      `geo_photo_${index + 1}_${Date.now()}.jpg`,
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      },
    );

    console.log(
      "FINAL IMAGE SIZE:",
      (geoTaggedFile.size / 1024 / 1024).toFixed(2),
      "MB",
    );

    return geoTaggedFile;
  };

  // ---------------------------------------------------------
  // Photo Selection
  // ---------------------------------------------------------

  const handlePhotoChange = async (event, index) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("कृपया फक्त image upload करा.");

      return;
    }

    // 5 MB validation
    if (file.size > 10 * 1024 * 1024) {
      alert("फोटोचा आकार 10 MB पेक्षा कमी असावा.");

      event.target.value = "";

      return;
    }

    try {
      setPhotoLoading((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });

      // -------------------------------------------------
      // Get GPS
      // -------------------------------------------------

      const location = await getCurrentLocation();

      const latitude = location.latitude;

      const longitude = location.longitude;

      // -------------------------------------------------
      // Get Address
      // -------------------------------------------------

      const address = await getAddressFromCoordinates(latitude, longitude);

      // -------------------------------------------------
      // Add Geo Tag
      // -------------------------------------------------

      const geoTaggedFile = await addGeoTagToImage({
        file,
        latitude,
        longitude,
        address,
        index,
      });

      // -------------------------------------------------
      // Preview
      // -------------------------------------------------

      const previewUrl = URL.createObjectURL(geoTaggedFile);

      setPhotos((prev) => {
        const updated = [...prev];

        updated[index] = {
          file: geoTaggedFile,
          preview: previewUrl,
          latitude,
          longitude,
          address,
        };

        return updated;
      });
    } catch (error) {
      console.error(error);

      if (error?.code === 1) {
        alert(
          "Location permission आवश्यक आहे. कृपया GPS permission Allow करा.",
        );
      } else if (error?.code === 2) {
        alert("आपले location मिळू शकले नाही.");
      } else if (error?.code === 3) {
        alert("Location मिळवण्यासाठी timeout झाला.");
      } else {
        alert("फोटो process करताना समस्या आली.");
      }
    } finally {
      setPhotoLoading((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });

      event.target.value = "";
    }
  };

  // ---------------------------------------------------------
  // Remove Photo
  // ---------------------------------------------------------

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const updated = [...prev];

      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }

      updated[index] = {
        file: null,
        preview: null,
        latitude: "",
        longitude: "",
        address: "",
      };

      return updated;
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        const result = reader.result;

        // Remove:
        // data:image/jpeg;base64,
        // and return only actual Base64
        const base64 = result.split(",")[1];

        resolve(base64);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const clearForm = () => {
    // Revoke existing photo preview URLs
    photos.forEach((photo) => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });

    // Reset form fields
    reset({
      panchnamaDate: getCurrentDate(),
      panchnamaTime: getCurrentTime(),

      officerName: "",
      officerDesignation: "",
      wardNo: "",

      advertisementAddress: "",

      employees: [
        {
          name: "",
          designation: "",
        },
      ],

      witnessName: "",

      advertisementDisplayedBy: [
        {
          name: "",
        },
      ],

      permissionDate: "",

      width: "",
      height: "",
    });

    // Reset photos
    setPhotos([
      {
        file: null,
        preview: null,
        latitude: "",
        longitude: "",
        address: "",
      },
      {
        file: null,
        preview: null,
        latitude: "",
        longitude: "",
        address: "",
      },
      {
        file: null,
        preview: null,
        latitude: "",
        longitude: "",
        address: "",
      },
    ]);

    // Reset photo loading
    setPhotoLoading([false, false, false]);

    // Clear file inputs
    fileRefs.current.forEach((input) => {
      if (input) {
        input.value = "";
      }
    });

    // Reset refs
    fileRefs.current = [];
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  const onSubmit = async (data) => {
    try {
      // =====================================================
      // CHECK PHOTOS
      // =====================================================

      const photoNames = [
        "जवळून फोटो",
        "दुरून फोटो",
        "पंचनामा करणाऱ्यासोबत फोटो",
      ];

      const missingPhotos = photos
        .map((photo, index) => (!photo.file ? photoNames[index] : null))
        .filter(Boolean);

      if (missingPhotos.length > 0) {
        showModal(
          "warning",
          "फोटो आवश्यक आहेत",
          `कृपया खालील फोटो अपलोड करा:\n\n${missingPhotos.join("\n")}`,
        );

        return;
      }

      setSubmitLoading(true);

      // =====================================================
      // USER
      // =====================================================

      const user = JSON.parse(localStorage.getItem("user"));

      // =====================================================
      // PAYLOAD
      // =====================================================

      const payload = {
        userId: user?.userId,

        ulbId: import.meta.env.VITE_ULBID,

        nameFirst: data.officerName,

        positionFirst: data.officerDesignation,

        address: data.advertisementAddress,

        users: JSON.stringify(data.employees),

        officerName: data.witnessName,

        advertName: JSON.stringify(data.advertisementDisplayedBy),

        sizeLen: data.width,

        sizeWidth: data.height,

        illegalDt: data.permissionDate,

        nearPhoto: await fileToBase64(photos[0].file),

        farPhoto: await fileToBase64(photos[1].file),

        photo: await fileToBase64(photos[2].file),

        latitude: photos[0].latitude,

        longitude: photos[0].longitude,
        prabhag: data.wardNo,
      };

      // =====================================================
      // API CALL
      // =====================================================

      const response = await apiClient.post(
        "/advertisement/insertIllegalHoard",
        payload,
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      if (String(response?.data?.errorCode) === "9999") {
        showModal(
          "success",
          "यशस्वी",
          response?.data?.message || "माहिती यशस्वीरित्या नोंदवली.",
        );

        // Clear form AFTER successful response
        clearForm();

        setTimeout(() => {
          navigate("/panchanama-list");
        }, 1500);
      } else {
        // =================================================
        // API BUSINESS ERROR
        // =================================================

        showModal(
          "error",
          "नोंदणी अयशस्वी",
          response?.data?.message || "माहिती नोंदवता आली नाही.",
        );
      }
    } catch (error) {
      console.error("Advertisement Panchnama Submit Error:", error);

      // =====================================================
      // API / NETWORK ERROR
      // =====================================================

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "डेटा submit करताना समस्या आली.";

      showModal("error", "त्रुटी", errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="panchnama-wrapper">
      <div className="panchnama-container">
        {/* PAGE TITLE */}

        <div className="page-title mb-4">अनधिकृत जाहिरात फलक पंचनामा</div>

        <div className="form-card">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* =====================================
                            PRIMARY INFORMATION
                        ===================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="section-title-1 m-0">प्राथमिक माहिती</div>
              <button
                type="button"
                onClick={() => navigate("/panchanama-list")}
                className="normal-btn"
              >
                <i className="bi bi-view-list me-1"></i>
                Panchnama List
              </button>
            </div>

            {/* DATE & TIME */}

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  दिनांक
                  <span className="required">*</span>
                </label>

                <div className="input-group">
                  <span className="input-group-text">दिनांक</span>

                  <input
                    type="date"
                    className={`form-control readonly-field ${
                      errors.panchnamaDate ? "is-invalid" : ""
                    }`}
                    {...register("panchnamaDate", {
                      required: "दिनांक आवश्यक आहे",
                    })}
                  />
                </div>

                {errors.panchnamaDate && (
                  <div className="field-error">
                    {errors.panchnamaDate.message}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  वेळ
                  <span className="required">*</span>
                </label>

                <div className="input-group">
                  <span className="input-group-text">वेळ</span>

                  <input
                    type="time"
                    className={`form-control readonly-field ${
                      errors.panchnamaTime ? "is-invalid" : ""
                    }`}
                    {...register("panchnamaTime", {
                      required: "वेळ आवश्यक आहे",
                    })}
                  />
                </div>

                {errors.panchnamaTime && (
                  <div className="field-error">
                    {errors.panchnamaTime.message}
                  </div>
                )}
              </div>
            </div>

            {/* USER */}

            {/* DESIGNATION */}

            <div className="row g-3 mb-3">
              {/* Officer Name */}
              <div className="col-md-6">
                <label className="form-label">
                  पंचनामा करणाऱ्याचे नाव
                  <span className="required">*</span>
                </label>

                <input
                  type="text"
                  readOnly
                  className={`form-control readonly-field ${
                    errors.officerName ? "is-invalid" : ""
                  }`}
                  placeholder="पंचनामा करणाऱ्याचे नाव"
                  {...register("officerName", {
                    required: "पंचनामा करणाऱ्याचे नाव आवश्यक आहे",
                  })}
                />

                {errors.officerName && (
                  <div className="field-error">
                    {errors.officerName.message}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  पंचनामा करणाऱ्याचे पद
                  <span className="required">*</span>
                </label>

                <input
                  type="text"
                  readOnly
                  className={`form-control readonly-field ${
                    errors.officerDesignation ? "is-invalid" : ""
                  }`}
                  value="सहाय्यक आयुक्त"
                  {...register("officerDesignation", {
                    required: "पंचनामा करणाऱ्याचे पद आवश्यक आहे",
                  })}
                />

                {errors.officerDesignation && (
                  <div className="field-error">
                    {errors.officerDesignation.message}
                  </div>
                )}
              </div>
            </div>

            {/* ADDRESS */}

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">
                  अनधिकृत जाहिरात लावलेल्या ठिकाणाचा संपूर्ण पत्ता
                  <span className="required">*</span>
                </label>

                <textarea
                  rows="3"
                  className={`form-control ${
                    errors.advertisementAddress ? "is-invalid" : ""
                  }`}
                  placeholder="संपूर्ण पत्ता लिहा"
                  {...register("advertisementAddress", {
                    required: "संपूर्ण पत्ता आवश्यक आहे",
                    minLength: {
                      value: 10,
                      message: "किमान 10 अक्षरे लिहा",
                    },
                  })}
                />

                {errors.advertisementAddress && (
                  <div className="field-error">
                    {errors.advertisementAddress.message}
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3 mb-4">
              {/* Ward No */}
              <div className="col-md-6">
                <label className="form-label">
                  प्रभाग क्रमांक
                  <span className="required">*</span>
                </label>

                <select
                  className={`form-select ${errors.wardNo ? "is-invalid" : ""}`}
                  {...register("wardNo", {
                    required: "प्रभाग क्रमांक आवश्यक आहे",
                  })}
                >
                  <option value="">-- प्रभाग क्रमांक निवडा --</option>

                  {loggedInUser?.wards?.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>

                {errors.wardNo && (
                  <div className="field-error">{errors.wardNo.message}</div>
                )}
              </div>
            </div>

            {/* =====================================
                            EMPLOYEES
                        ===================================== */}

            <div className="mb-4">
              <label className="form-label">
                सोबत उपस्थित कर्मचाऱ्यांचे नाव
                <span className="required">*</span>
              </label>

              {employeeFields.map((field, index) => (
                <div className="row g-2 person-row mb-2" key={field.id}>
                  {/* EMPLOYEE NAME */}
                  <div className="col-md-6">
                    <input
                      type="text"
                      className={`form-control ${
                        errors.employees?.[index]?.name ? "is-invalid" : ""
                      }`}
                      placeholder="कर्मचाऱ्याचे नाव"
                      {...register(`employees.${index}.name`, {
                        required: "कर्मचाऱ्याचे नाव आवश्यक आहे",
                      })}
                    />

                    {errors.employees?.[index]?.name && (
                      <div className="field-error">
                        {errors.employees[index].name.message}
                      </div>
                    )}
                  </div>

                  {/* DESIGNATION */}
                  <div className="col-md-5">
                    <input
                      type="text"
                      className={`form-control ${
                        errors.employees?.[index]?.designation
                          ? "is-invalid"
                          : ""
                      }`}
                      placeholder="पद"
                      {...register(`employees.${index}.designation`, {
                        required: "पद आवश्यक आहे",
                      })}
                    />

                    {errors.employees?.[index]?.designation && (
                      <div className="field-error">
                        {errors.employees[index].designation.message}
                      </div>
                    )}
                  </div>

                  {/* REMOVE BUTTON */}
                  {employeeFields.length > 1 && (
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={() => removeEmployee(index)}
                        title="काढा"
                      >
                        −
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* ADD BUTTON */}
              {employeeFields.length < 5 && (
                <button
                  type="button"
                  className="btn btn-outline-primary add-btn"
                  onClick={handleAddEmployee}
                >
                  + आणखी नाव जोडा
                </button>
              )}

              {/* MAX 5 MESSAGE */}
              {employeeFields.length >= 5 && (
                <div className="text-muted mt-2">
                  जास्तीत जास्त 5 कर्मचारी जोडता येतील.
                </div>
              )}
            </div>

            {/* =====================================
                            WITNESSES
                        ===================================== */}

            <div className="mb-4">
              <label className="form-label">
                उपस्थित पंचाचे नाव
                <span className="required">*</span>
              </label>

              <div className="row">
                <div className="col-md-8">
                  <input
                    type="text"
                    className={`form-control ${
                      errors.witnessName ? "is-invalid" : ""
                    }`}
                    placeholder="पंचाचे नाव"
                    {...register("witnessName", {
                      required: "पंचाचे नाव आवश्यक आहे",
                    })}
                  />

                  {errors.witnessName && (
                    <div className="field-error">
                      {errors.witnessName.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================
                            ADVERTISEMENT DISPLAYED BY
                        ===================================== */}

            <div className="mb-4">
              <label className="form-label">
                जाहिरात फलक प्रदर्शित करणाऱ्याचे नाव
                <span className="required">*</span>
              </label>

              {advertisementFields.map((field, index) => (
                <div className="row g-2 mb-2" key={field.id}>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className={`form-control ${
                        errors.advertisementDisplayedBy?.[index]?.name
                          ? "is-invalid"
                          : ""
                      }`}
                      placeholder={`नाव ${index + 1}`}
                      {...register(`advertisementDisplayedBy.${index}.name`, {
                        required: index === 0 ? "नाव आवश्यक आहे" : false,
                      })}
                    />

                    {errors.advertisementDisplayedBy?.[index]?.name && (
                      <div className="field-error">
                        {errors.advertisementDisplayedBy[index].name.message}
                      </div>
                    )}
                  </div>

                  {/* REMOVE BUTTON */}

                  {advertisementFields.length > 1 && (
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={() => removeAdvertisement(index)}
                        title="काढा"
                      >
                        −
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* ADD BUTTON */}

              {advertisementFields.length < 5 && (
                <button
                  type="button"
                  className="btn btn-outline-primary add-btn"
                  onClick={handleAddAdvertisement}
                >
                  + आणखी नाव जोडा
                </button>
              )}

              {advertisementFields.length >= 5 && (
                <div className="text-muted mt-2">
                  जास्तीत जास्त 5 नावे जोडता येतील.
                </div>
              )}
            </div>

            {/* =====================================
                            SIZE
                        ===================================== */}

            <div className="mb-4">
              <label className="form-label">
                जाहिरात फलकाचा आकार
                <span className="required">*</span>
              </label>

              <div className="row g-2 align-items-start">
                {/* WIDTH */}
                <div className="col-5 col-md-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`form-control ${
                      errors.width ? "is-invalid" : ""
                    }`}
                    placeholder="फलकाची रुंदी"
                    {...register("width", {
                      required: "फलकाची रुंदी आवश्यक आहे",
                      valueAsNumber: true,
                      min: {
                        value: 0.01,
                        message: "फलकाची रुंदी 0 पेक्षा जास्त असावी",
                      },
                    })}
                  />

                  {errors.width && (
                    <div className="field-error">{errors.width.message}</div>
                  )}
                </div>

                <div className="col-auto pt-2">
                  <span className="fw-bold">फूट</span>
                </div>

                {/* HEIGHT */}
                <div className="col-5 col-md-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`form-control ${
                      errors.height ? "is-invalid" : ""
                    }`}
                    placeholder="फलकाची लांबी"
                    {...register("height", {
                      required: "फलकाची लांबी आवश्यक आहे",
                      valueAsNumber: true,
                      min: {
                        value: 0.01,
                        message: "फलकाची लांबी 0 पेक्षा जास्त असावी",
                      },
                    })}
                  />

                  {errors.height && (
                    <div className="field-error">{errors.height.message}</div>
                  )}
                </div>

                <div className="col-auto pt-2">
                  <span className="fw-bold">फूट</span>
                </div>
              </div>
            </div>

            {/* =====================================
                            PERMISSION
                        ===================================== */}

            {/* =====================================
    PERMISSION DATE
===================================== */}

            <div className="mb-4">
              <label className="form-label">
                जाहिरात फलक केव्हापासून अनधिकृतपणे प्रदर्शित केला आहे ?
                <span className="required">*</span>
              </label>

              <div className="row">
                <div className="col-md-6">
                  <input
                    type="date"
                    className={`form-control ${
                      errors.permissionDate ? "is-invalid" : ""
                    }`}
                    {...register("permissionDate", {
                      required: "परवानगी दिनांक आवश्यक आहे",
                    })}
                  />

                  {errors.permissionDate && (
                    <div className="field-error">
                      {errors.permissionDate.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================
                            PHOTOS
                        ===================================== */}

            <div className="mb-4">
              <label className="form-label">
                जाहिरात फलकाचे फोटो
                <span className="required">*</span>
              </label>

              <div className="photo-table-wrapper">
                <table className="table table-bordered align-middle text-center photo-table">
                  <thead className="table-light">
                    <tr>
                      <th>
                        जवळून फोटो
                        <span className="required">*</span>
                      </th>

                      <th>
                        दुरून फोटो
                        <span className="required">*</span>
                      </th>

                      <th>
                        पंचनामा करणाऱ्यासोबत फोटो
                        <span className="required">*</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      {photos.map((photo, index) => (
                        <td key={index}>
                          <div
                            className={`geo-photo-box ${
                              photoLoading[index] ? "disabled" : ""
                            } ${
                              !photo.file && !photoLoading[index]
                                ? "photo-required"
                                : ""
                            }`}
                            onClick={() =>
                              !photoLoading[index] && openCamera(index)
                            }
                          >
                            <div className="photo-preview">
                              {photoLoading[index] ? (
                                <div className="upload-loader">
                                  <div className="spinner-border text-primary"></div>

                                  <div className="mt-2">
                                    Location मिळवत आहे...
                                  </div>
                                </div>
                              ) : photo.preview ? (
                                <img
                                  src={photo.preview}
                                  alt={`Geo Photo ${index + 1}`}
                                  className="full-photo"
                                />
                              ) : (
                                <div className="upload-placeholder">
                                  <div className="camera-icon">📷</div>

                                  <div className="camera-text">
                                    Geo Tag Photo
                                    <br />
                                    <small>Tap to capture</small>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* FILE INPUT */}

                          <input
                            ref={(element) => {
                              fileRefs.current[index] = element;
                            }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="d-none"
                            onChange={(e) => handlePhotoChange(e, index)}
                          />

                          {/* REMOVE BUTTON */}

                          {photo.preview && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger remove-photo-btn mt-2"
                              onClick={() => removePhoto(index)}
                            >
                              फोटो काढा
                            </button>
                          )}

                          {/* REQUIRED MESSAGE */}

                          {!photo.file && !photoLoading[index] && (
                            <div className="field-error mt-2">
                              फोटो आवश्यक आहे
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* =====================================
                            SUBMIT
                        ===================================== */}

            <div className="text-center mt-4">
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={submitLoading}
              >
                {submitLoading ? "SUBMIT होत आहे..." : "SUBMIT"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ResponseModal
        isOpen={isModalOpen}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      />
    </div>
  );
}

export default AdvertisementPanchnama;
