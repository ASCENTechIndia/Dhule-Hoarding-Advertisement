
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";


class ApiClient {

  async request(endpoint, options = {}) {

    const {
      method = "GET",
      data = null,
      params = null,
      headers = {},
      timeout = 300000,

      // NEW:
      // json | blob | arraybuffer | text
      responseType = "json",

    } = options;


    // =====================================================
    // BUILD URL
    // =====================================================

    const baseUrl =
      `${API_BASE_URL}${endpoint}`;


    const query =
      params
        ? new URLSearchParams(params).toString()
        : "";


    const url =
      query
        ? `${baseUrl}${
            baseUrl.includes("?")
              ? "&"
              : "?"
          }${query}`
        : baseUrl;


    // =====================================================
    // TOKEN
    // =====================================================

    const token =
      localStorage.getItem("token");


    const finalHeaders = {

      "Content-Type":
        "application/json",

      ...headers,

    };


    if (token) {

      finalHeaders.Authorization =
        `Bearer ${token}`;

    }


    try {

      // ===================================================
      // ABORT CONTROLLER
      // ===================================================

      const controller =
        new AbortController();


      const timeoutId =
        setTimeout(
          () => controller.abort(),
          timeout
        );


      // ===================================================
      // FETCH
      // ===================================================

      const response =
        await fetch(
          url,
          {
            method,

            headers:
              finalHeaders,

            body:
              data !== null &&
              data !== undefined
                ? JSON.stringify(data)
                : null,

            signal:
              controller.signal,
          }
        );


      clearTimeout(
        timeoutId
      );


      // ===================================================
      // ERROR RESPONSE
      // ===================================================

      if (!response.ok) {

        let errorMessage =
          `HTTP ${response.status}`;


        try {

          const contentType =
            response.headers.get(
              "content-type"
            );


          // -----------------------------------------------
          // JSON ERROR
          // -----------------------------------------------

          if (
            contentType &&
            contentType.includes(
              "application/json"
            )
          ) {

            const errorData =
              await response.json();


            errorMessage =
              errorData?.message ||
              errorData?.error ||
              errorMessage;

          }

          // -----------------------------------------------
          // TEXT ERROR
          // -----------------------------------------------

          else {

            const text =
              await response.text();


            if (text) {
              errorMessage = text;
            }

          }

        } catch (parseError) {

          console.error(
            "Error parsing API error:",
            parseError
          );

        }


        throw new Error(
          errorMessage
        );

      }


      // ===================================================
      // RESPONSE TYPE: BLOB
      // ===================================================

      if (
        responseType === "blob"
      ) {

        return await response.blob();

      }


      // ===================================================
      // RESPONSE TYPE: ARRAY BUFFER
      // ===================================================

      if (
        responseType === "arraybuffer"
      ) {

        return await response.arrayBuffer();

      }


      // ===================================================
      // RESPONSE TYPE: TEXT
      // ===================================================

      if (
        responseType === "text"
      ) {

        return await response.text();

      }


      // ===================================================
      // DEFAULT: JSON
      // =====================================================

      return await response.json();


    } catch (error) {

      // ===================================================
      // TIMEOUT
      // ===================================================

      if (
        error.name ===
        "AbortError"
      ) {

        throw new Error(
          "Request timeout"
        );

      }


      // ===================================================
      // API ERROR
      // ===================================================

      throw new Error(
        error.message ||
        "API request failed"
      );

    }

  }


  // =======================================================
  // GET
  // =======================================================

  get(
    endpoint,
    options = {}
  ) {

    return this.request(
      endpoint,
      {
        ...options,
        method: "GET",
      }
    );

  }


  // =======================================================
  // POST
  // =======================================================

  post(
    endpoint,
    data,
    options = {}
  ) {

    return this.request(
      endpoint,
      {
        ...options,
        method: "POST",
        data,
      }
    );

  }


  // =======================================================
  // PUT
  // =======================================================

  put(
    endpoint,
    data,
    options = {}
  ) {

    return this.request(
      endpoint,
      {
        ...options,
        method: "PUT",
        data,
      }
    );

  }


  // =======================================================
  // PATCH
  // =======================================================

  patch(
    endpoint,
    data,
    options = {}
  ) {

    return this.request(
      endpoint,
      {
        ...options,
        method: "PATCH",
        data,
      }
    );

  }


  // =======================================================
  // DELETE
  // =======================================================

  delete(
    endpoint,
    options = {}
  ) {

    return this.request(
      endpoint,
      {
        ...options,
        method: "DELETE",
      }
    );

  }

}


export default new ApiClient();