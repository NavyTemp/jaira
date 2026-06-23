const confirmEmailTemplate = ({ code, userName = "User" }) => {
  return `
  <div style="margin:0;padding:0;background:#020617;font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">

          <table 
            width="600" 
            cellpadding="0" 
            cellspacing="0"
            style="
              background:#0f172a;
              border-radius:24px;
              overflow:hidden;
              border:1px solid #1e293b;
              box-shadow:0 15px 50px rgba(0,0,0,.5);
            "
          >

            <!-- HEADER -->
            <tr>
              <td
                style="
                  background:linear-gradient(135deg,#2563eb,#06b6d4);
                  padding:45px;
                  text-align:center;
                "
              >
                <h1 style="margin:0;color:white;font-size:34px;">
                  🚀 TaskFlow
                </h1>

                <p style="margin-top:12px;color:#dbeafe;font-size:15px;">
                  Manage Tasks • Teams • Productivity
                </p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:50px 40px;">

                <h2 style="color:white;margin-top:0;">
                  Hey ${userName} 👋
                </h2>

                <p style="color:#cbd5e1;line-height:1.9;font-size:15px;">
                  Welcome to <strong>TaskFlow</strong>.
                  Use the verification code below to activate your account.
                </p>

                <!-- OTP BOX -->
                <div style="text-align:center;margin:45px 0;">

                  <div
                    style="
                      display:inline-block;
                      background:#111827;
                      border:2px dashed #3b82f6;
                      border-radius:18px;
                      padding:22px 40px;
                    "
                  >
                    <span
                      style="
                        font-size:42px;
                        letter-spacing:12px;
                        font-weight:bold;
                        color:#38bdf8;
                      "
                    >
                      ${code}
                    </span>
                  </div>

                </div>

                <p style="color:#94a3b8;font-size:14px;line-height:1.8;">
                  This code will expire in 5 minutes.
                </p>

                <p style="color:#94a3b8;font-size:14px;line-height:1.8;">
                  If you didn’t request this email, you can safely ignore it.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td
                style="
                  border-top:1px solid #1e293b;
                  text-align:center;
                  padding:25px;
                  color:#64748b;
                  font-size:13px;
                "
              >
                © 2026 TaskFlow. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </div>
  `;
};

export default confirmEmailTemplate;