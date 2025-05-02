export const StudentPasswordReset = (username: string, password: string) => {
  return `<html>
    <head>
      <meta charset="UTF-8" />
      <title>Welcome to Apex Horizon University</title>
    </head>
    <body
      style="
        font-family: Arial, sans-serif;
        background-color: #f6f8fb;
        padding: 20px;
        margin: 0;
      "
    >
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table
              width="600"
              cellpadding="0"
              cellspacing="0"
              style="
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
              "
            >
              <tr>
                <td
                  style="
                    background-color: #000000;
                    padding: 20px;
                    text-align: center;
                    color: #ffffff;
                  "
                >
                  <h1 style="margin: 0">Apex Horizon University</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px">
                  <h2 style="color: #333333">You're Invited!</h2>
                  <p>
                    Greeting from <strong>Apex Horizon University</strong>. Your password
                    have been reset by administrator
                  </p>
  
                  <p>Here are your login credentials:</p>
  
                  <table
                    style="
                      margin: 20px 0;
                      background-color: #f0f4f8;
                      padding: 15px;
                      border-radius: 5px;
                    "
                  >
                    <tr>
                      <td><strong>Username:</strong></td>
                      <td>${username}</td>
                    </tr>
                    <tr>
                      <td><strong>Password:</strong></td>
                      <td>${password}</td>
                    </tr>
                  </table>
  
                  <p>
                    You can log in at:
                    <a
                      href="https://ewsd-frontend.vercel.app/student/login"
                      target="_blank"
                      >https://ewsd-frontend.vercel.app/student/login</a
                    >
                  </p>
  
                  <p style="margin-top: 30px">
                    If you have any issues, please contact support.
                  </p>
  
                  <p>Best regards,<br />The Apex Horizon University Team</p>
                </td>
              </tr>
              <tr>
                <td
                  style="
                    background-color: #f0f4f8;
                    text-align: center;
                    padding: 15px;
                    font-size: 12px;
                    color: #888;
                  "
                >
                  &copy; 2025 Apex Horizon University. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};
