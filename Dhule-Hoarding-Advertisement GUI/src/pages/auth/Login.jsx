import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import apiClient from "../../services/apiClient";
import logo from "../../../public/assets/images/dhule-logo.png";
import GetIPAddress from "../../utils/IpHelper";
import config from "../../utils/config";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const dummyUsers = [
  {
    firstName: "श्री. किशोर शिंदे",
    contact: "8668513587",
    userId: "DMCPCL57",
    wards: ["1", "2", "4", "5", "6", "7"]
  },
  {
    firstName: "श्री. सागर जकातदार",
    contact: "9822491201",
    userId: "DMCPCL56",
    wards: ["3", "11", "12", "15"]
  },
  {
    firstName: "श्री. राजेंद्र माईनकर",
    contact: "9422786402",
    userId: "DMCND01",
    wards: ["13", "14", "16", "18", "19"]
  },
  {
    firstName: "श्री. किशोर वाघ",
    contact: "9422333719",
    userId: "DMCBD03",
    wards: ["8", "9", "10", "17"]
  }
];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      userId: "",
      password: "",
    },
  });


  // dummy login
  const onSubmit = async (values) => {
  setError("");
  setIsLoading(true);

  try {
    if (!values.userId) {
      setError("User ID is required.");
      setIsLoading(false);
      return;
    }

    const user = dummyUsers.find(
      (item) =>
        item.userId.toLowerCase() === values.userId.trim().toLowerCase()
    );

    if (!user) {
      setError("Invalid User ID.");
      setIsLoading(false);
      return;
    }

    // This is your matched user
    console.log("Logged in user:", user);

    // Example:
    // {
    //   firstName: "श्री. किशोर शिंदे",
    //   contact: "8668513587",
    //   userId: "DMCPCL57",
    //   wards: ["१", "२", "४", "५", "६", "७"]
    // }

    login(user);

    reset();

    navigate("/advertisementPanchnama-form");

  } catch (err) {
    setError(err.message || "Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  // const onSubmit = async (values) => {
  //   // console.log(values);
  //   // e.preventDefault();
  //   setError('');
  //   setIsLoading(true);

  //   try {
  //     // Validate inputs
  //     if (!values.userId || !values.password) {
  //       setError('User ID and password are required.');
  //       setIsLoading(false);
  //       return;
  //     }

  //     // if (values.password.length < 8) {
  //     //   setError('Password must be at least 8 characters.');
  //     //   setIsLoading(false);
  //     //   return;
  //     // }
  //     const ipAddress = await GetIPAddress();
  //     const payload = {
  //       "userId": values.userId,
  //       "password": values.password,
  //       "macaddr": config.macAddress,
  //       "ipaddr": ipAddress,
  //       "hostname": config.hostName,
  //       "source": config.source
  //     };

  //     // Simulate API call (replace with actual API)
  //     const response = await apiClient.post(`/auth/login`, payload);

  //     if (response.success) {
  //       const userData = response?.data?.user;
  //       login(userData);
  //       reset();
  //       userData.designation === "Supervisor" ? navigate("/advertisementPanchnama-form") : navigate("/advertisementPanchnama-form");
  //     } else {
  //       setError('Login failed. Please try again.');
  //     }
  //   } catch (err) {
  //     setError(err.message || 'Login failed. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  //  without sso
  // const loginUser = async (userid, password) => {
  //   try {
  //     const ipAddress = await GetIPAddress();

  //     const payload = {
  //       userId: userid,
  //       password,
  //       macaddr: config.macAddress,
  //       ipaddr: ipAddress,
  //       hostname: config.hostName,
  //       source: config.source,
  //     };

  //     // console.log("🚀 Login Payload:", payload);

  //     const res = await apiClient.post("/auth/login", payload, {
  //       withCredentials: true,
  //     });

  //     // console.log("✅ Login API Response:", res);

  //     if (!res.success) {
  //       throw new Error("Login failed. Please try again.");
  //     }

  //     const { token, user } = res.data;

  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));

  //     return { token, user };
  //   } catch (err) {
  //     console.error("❌ Login Error:", err);
  //     throw err;
  //   }
  // };

  // const onSubmit = async (values) => {
  //   setError("");
  //   setIsLoading(true);

  //   try {
  //     if (!values.userId || !values.password) {
  //       setError("User ID and password are required.");
  //       return;
  //     }
  //     const ipAddress = await GetIPAddress();

  //     const payload = {
  //       userId: values.userId,
  //       password: values.password,
  //       macaddr: config.macAddress,
  //       ipaddr: ipAddress,
  //       hostname: config.hostName,
  //       source: config.source,
  //     };

  //     const response = await apiClient.post("/auth/login", payload);

  //     if (!response.success) {
  //       setError("Login failed. Please try again.");
  //       return;
  //     }

  //     const { token, user } = response.data;

  //     // Store data
  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));

  //     // Existing auth context
  //     login(user);

  //     // If you have separate admin context
  //     // loginAdmin(user, token);

  //     reset();

  //     // OTP Flow
  //     if (user.otpValidate === "Y") {
  //       navigate("/otp-verification", {
  //         state: {
  //           userId: user.userId,
  //           mobile: user.mobileNo,
  //           ulbId: user.out_OrgId,
  //           maskedMobile: user.mobileNo?.replace(
  //             /^(\d{2})\d{6}(\d{2})$/,
  //             "$1******$2",
  //           ),
  //         },
  //       });
  //     } else {
  //       // Existing Role Based Navigation
  //       user.designation === "Supervisor"
  //         ? navigate("/dashboard")
  //         : navigate("/dashboard");
  //     }
  //   } catch (err) {
  //     setError(err.message || "Login failed. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleSilentSubmit = async (userid, password) => {
  //   try {
  //     // console.log("🚀 Silent Login Start");
  //     // console.log("Userid:", userid);
  //     // console.log("Password:", password);

  //     setLoading(true);

  //     const data = await loginUser(userid, password);

  //     // console.log("✅ Login Response:", data);

  //     const { token, user } = data;

  //     // console.log("Token:", token);
  //     // console.log("User:", user);

  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));

  //     login(user, token);

  //     navigate("/");
  //   } catch (err) {
  //     console.error("❌ Silent Login Error:", err);
  //     setError(err.message || "Silent login failed.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const validateTokenAndLogin = async () => {
  //   try {
  //     // console.log("🚀 Calling validate-token API...");

  //     const response = await axios.post(
  //       `${API_BASE_URL}/auth/validate-token`,
  //       {},
  //       {
  //         withCredentials: true,
  //       },
  //     );

  //     // console.log("✅ Validate Response:", response.data);

  //     const outBinds = response?.data?.outBinds;

  //     // console.log("🔥 outBinds:", outBinds);

  //     if (Number(outBinds?.out_ErrorCode) === 9999) {
  //       // console.log("✅ Token Valid");

  //       await handleSilentSubmit(outBinds.out_userid, outBinds.out_encpassword);

  //       return true;
  //     }

  //     // console.log(
  //     //   "❌ Token Invalid:",
  //     //   outBinds?.out_ErrorCode,
  //     //   outBinds?.out_ErrorMsg
  //     // );

  //     return false;
  //   } catch (err) {
  //     console.error("❌ Validate Token Error:", err);
  //     console.error("❌ Response Data:", err?.response?.data);

  //     return false;
  //   }
  // };

  // useEffect(() => {
  //   const checkSession = async () => {
  //     const ok = await validateTokenAndLogin();
  //     if (!ok) {
  //       window.location.href = "https://nagarkaryavalinewuat.com/";
  //     }
  //   };
  //   checkSession();
  // }, []);

  return (
    <>
      {loading ? (
        // Show fullscreen loader
        <div className="flex justify-center items-center h-screen bg-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50"></div>
        </div>
      ) : (
        <div>
          <main className="auth-page">
            <section className="auth-card">
           <div className="auth-brand">
  <img
    src={logo}
    alt="Dhule Municipal Corporation Logo"
    className="m-auto"
  />

  <div>
    <strong>
      माझी कानबाई, पर्यावरणपूरक कानबाई स्पर्धा
    </strong>
  </div>
</div>
              <form
                className="needs-validation"
                noValidate
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="mb-4">
                  <h1 className="h3 mb-1">Login</h1>
                  <p className="text-muted mb-0">
                    Sign in to your admin workspace.
                  </p>
                </div>

                {error && (
                  <div
                    className="alert alert-danger alert-dismissible fade show"
                    role="alert"
                  >
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}

                {/* User ID */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="UserID">
                    User ID
                  </label>

                  <input
                    className={`form-control ${
                      errors.userId ? "is-invalid" : ""
                    }`}
                    id="UserID"
                    type="text"
                    // inputMode="numeric"
                    maxLength={10}
                    // onInput={(e) => {
                    //   e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    // }}
                    {...register("userId", {
                      required: "User ID is required",
                      // pattern: {
                      //   value: /^[0-9]+$/,
                      //   message: "User ID must be numeric only",
                      // },
                    })}
                  />

                  {errors.userId && (
                    <div className="invalid-feedback">
                      {errors.userId.message}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" htmlFor="loginPassword">
                      Password
                    </label>
                  </div>

                  <input
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                    id="loginPassword"
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      // minLength: {
                      //   value: 8,
                      //   message: "Password must be at least 8 characters",
                      // },
                    })}
                  />

                  {errors.password && (
                    <div className="invalid-feedback">
                      {errors.password.message}
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={isLoading}
                >
                  <i
                    className="bi bi-box-arrow-in-right"
                    aria-hidden="true"
                  ></i>{" "}
                  {isLoading ? "Logging In..." : "Log In"}
                </button>
              </form>

              {/* <div className="auth-footer">New here? <Link to="/register">Create an account</Link></div> */}
            </section>
          </main>
        </div>
      )}
    </>
  );
}
