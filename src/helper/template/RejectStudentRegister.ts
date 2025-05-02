export const RejectStudentRegister = (reason: string) => {
  return `
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Greeting from Apex Horizon University</title>
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
                <h2 style="color: #333333">
                  Rejected!
                </h2>
                <p>
                  Greeting from <strong>Apex Horizon University</strong>. Your
                  student registration has been rejected. reason -
                  <strong>${reason}</strong>
                </p>

                <p>
                  You can contact customer server for more information from
                  contact us section of University website.
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
</html>
`;
};
