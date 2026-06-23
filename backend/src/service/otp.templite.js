const forgotPasswordTemplate = ({
  code,
  userName = "User",
}) => {
  return `
  <div style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">

          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              background:#111827;
              border-radius:20px;
              overflow:hidden;
              box-shadow:0 10px 30px rgba(0,0,0,.4);
            "
          >

            <!-- Header -->
            <tr>
              <td
                style="
                  background:linear-gradient(135deg,#ef4444,#dc2626);
                  padding:40px;
                  text-align:center;
                "
              >
                <h1 style="margin:0;color:white;">
                  🔐 Password Reset
                </h1>

                <p style="color:#fecaca;margin-top:10px;">
                  Reset your account password
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">

                <h2 style="color:white;">
                  Hello ${userName} 👋
                </h2>

                <p style="
                  color:#d1d5db;
                  line-height:1.8;
                ">
                  We received a request to reset your password.
                </p>

                <p style="
                  color:#d1d5db;
                  line-height:1.8;
                ">
                  Use the verification code below:
                </p>

                <!-- OTP -->
                <div style="
                  text-align:center;
                  margin:35px 0;
                ">

                  <div style="
                    display:inline-block;
                    background:#1f2937;
                    padding:20px 35px;
                    border-radius:15px;
                    border:2px dashed #ef4444;
                  ">
                    <span style="
                      font-size:38px;
                      font-weight:bold;
                      letter-spacing:10px;
                      color:#f87171;
                    ">
                      ${code}
                    </span>
                  </div>

                </div>

                <p style="
                  color:#9ca3af;
                  font-size:14px;
                ">
                  ⏳ This code expires in 5 minutes.
                </p>

                <p style="
                  color:#9ca3af;
                  font-size:14px;
                ">
                  If you didn't request a password reset, ignore this email.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                border-top:1px solid #374151;
                padding:25px;
                text-align:center;
                color:#6b7280;
                font-size:12px;
              ">
                © 2026 TaskFlow
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </div>
  `;
};

export default forgotPasswordTemplate;