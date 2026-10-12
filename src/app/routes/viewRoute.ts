export const verifyEmailBody = (token: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Verification</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
          .success { color: green; }
          .fail { color: red; }
          h1 { margin-bottom: 10px; }
          p { margin-top: 8px; }
          a.button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          a.button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div id="status">
          <h1>⏳</h1>
          <h1>Verifying your email...</h1>
          <p>Please wait while we confirm your account.</p>
        </div>

        <script>
          fetch('https://bolubocool-ecommerce-server.vercel.app/api/v1/user/verify?token=${token}', { method: 'GET' })
            .then(res => res.json())
            .then(data => {
              const statusDiv = document.getElementById("status");
              if (data.success === true) {
                statusDiv.innerHTML = \`
                  <h1 class="success">✅</h1>
                  <h1 class="success">Email Verified Successfully</h1>
                  <p>Your account has been activated. You can now log in.</p>
                  <a href="https://bolubocool-frontend.vercel.app/signin" class="button">Go to Login</a>
                \`;
              } else {
                statusDiv.innerHTML = \`
                  <h1 class="fail">❌</h1>
                  <h1 class="fail">Verification Failed</h1>
                  <p>The link is invalid or has expired.</p>
                  <a href="/" class="button" style="background:red;">Go to Home</a>
                \`;
              }
            })
            .catch(err => {
              const statusDiv = document.getElementById("status");
              statusDiv.innerHTML = \`
                <h1 class="fail">⚠️</h1>
                <h1 class="fail">Verification Error</h1>
                <p>We encountered an error while verifying your email.</p>
                <p>Please try again later.</p>
                <a href="/" class="button" style="background:red;">Go to Home</a>
              \`;
              console.error("Verification failed:", err);
            });
        </script>
      </body>
    </html>
  `;
};

export const accountSuccess = () => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stripe Connection Successful</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 100px;
          }
          .success {
            color: green;
          }
          h1 {
            margin-bottom: 10px;
          }
          p {
            margin-top: 8px;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅</h1>
          <h1>Your Stripe account is connected!</h1>
          <p>You're all set to receive payments through our platform.</p>
          <p>Thank you for completing the setup.</p>
          <a href="https://bolubocool-frontend.vercel.app/" class="btn">Go to Home</a>
          <a href="https://bolubocool-dashboard.vercel.app/allProduct" class="btn">Go to Dashboard</a>
        </div>
      </body>
    </html>
  `;
};

export const paystackPaymentSuccess = (token: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Status</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 100px;
          }
          .success {
            color: green;
          }
          .error {
            color: red;
          }
          h1 {
            margin-bottom: 10px;
          }
          p {
            margin-top: 8px;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div id="message"></div>

        <script>
          fetch('https://bolubocool-ecommerce-server.vercel.app/api/v1/order/capture-payment/${token}', {
            method: 'POST'
          })
          .then(res => res.json())
          .then(data => {
            const container = document.getElementById("message");
            if (data.success) {
              container.innerHTML = \`
                <div class="success">
                  <h1>✅</h1>
                  <h1>\${data.message}</h1>
                  <p>Your booking has been confirmed. Stay tuned for further updates.</p>
                  <a href="https://bolubocool-frontend.vercel.app/my-account" class="btn">View Orders</a>
                </div>
              \`;
            } else {
              container.innerHTML = \`
                <div class="error">
                  <h1>❌</h1>
                  <h1>Payment Failed</h1>
                  <p>Something went wrong while processing your payment.</p>
                  <a href="https://bolubocool-frontend.vercel.app/" class="btn">Go to Home</a>
                </div>
              \`;
            }
          })
          .catch(err => {
            const container = document.getElementById("message");
            container.innerHTML = \`
              <div class="error">
                <h1>❌</h1>
                <h1>Payment Verification Error</h1>
                <p>We couldn’t verify your payment. Please contact support.</p>
                <a href="https://bolubocool-frontend.vercel.app/" class="btn">Go to Home</a>
              </div>
            \`;
            console.error("Capture error:", err);
          });
        </script>
      </body>
    </html>
  `;
};

