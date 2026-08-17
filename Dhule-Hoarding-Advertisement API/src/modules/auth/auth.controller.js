const { loginUser } = require('./auth.service');
const { logApiSuccess, logApiError } = require('../../utils/log');
const { encryptPassword } = require('../../utils/login-password-crypto');

async function login(req, res, next) {
  try {
    const payload = req.body;

    // =========================================================
    // TEMPORARY HARDCODED LOGIN
    // =========================================================

    if (
      payload.userId === "admin" &&
      payload.password === "admin@123"
    ) {
      const dummyUser = {
        userId: "admin",
        userFullName: "Admin",
        lastLogin: "12-08-2026 05:02:22 PM",
        lastLogout: null,

        corporation: "धुळे महानगरपालिका",
        corporationAddress: "Dhule Municipal Corporation",

        receiptOfficeName: "Dhule Municipal Corporation",
        chalanOfficeName: null,

        prabhagName: "Zone Bhivandi 12.",
        prabhagId: "241",

        desigId: "865",
        userType: "2",

        collectionCenter: 241,
        mobileNo: "9999999999",

        otpValidate: "N",
        orgId: 4,

        forceFullPassChange: "N",
        designation: "HOD",
      };

      return res.ok({
        token: "temporary-admin-token",
        user: dummyUser,
      });
    }

    // =========================================================
    // INVALID TEMPORARY LOGIN
    // =========================================================

    return res.fail(
      "Invalid username or password",
      401
    );


    /*
    ============================================================
    OLD LOGIN FUNCTIONALITY
    ============================================================

    const payload = req.body;

    let encryptPass;

    try {
      encryptPass = encryptPassword(payload.password);
    } catch (_error) {
      logApiError(
        req,
        400,
        "Invalid encrypted password",
        "Login failed: invalid encrypted password payload"
      );

      return res.fail(
        "Invalid encrypted password",
        400
      );
    }

    const result = await loginUser(
      payload.userId,
      encryptPass,
      payload.macaddr,
      payload.ipaddr,
      payload.hostname,
      payload.source
    );

    if (!result.success) {
      logApiError(
        req,
        401,
        result.message,
        `Login failed for user: ${payload.userId}`
      );

      return res.fail(
        result.message,
        401,
        {
          errorCode: result.errorCode,
        }
      );
    }

    res.cookie("access_token", result.token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".nagarkaryavalinewuat.com",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.ok({
      token: result.token,
      user: result.user,
    });

    ============================================================
    */

  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Login controller error"
    );

    return next(error);
  }
}

module.exports = {
  login,
};
