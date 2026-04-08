const nodemailer = require('nodemailer');

/**
 * Create a Nodemailer transporter.
 * Falls back to console logging when SMTP is not configured.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  console.log('🔧 SMTP Configuration:');
  console.log(`   Host: ${host || 'NOT SET'}`);
  console.log(`   Port: ${port}`);
  console.log(`   User: ${user || 'NOT SET'}`);
  console.log(`   Pass: ${pass ? '***' : 'NOT SET'}`);

  if (host && user && pass) {
    console.log('✅ Creating SMTP transporter...');
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // Use TLS for port 465, STARTTLS for 587
      auth: { user, pass },
    });
  }

  // No SMTP configured — return null (we'll log to console instead)
  console.log('⚠️  SMTP not configured - will log to console');
  return null;
}

/**
 * Send a verification email to a new user.
 */
async function sendVerificationEmail(email, fullName, token) {
  console.log('📧 sendVerificationEmail called');
  console.log(`   Email: ${email}, Name: ${fullName}`);
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyLink = `${frontendUrl}/#/verify-email/${token}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { margin: 0; padding: 0; background: #0a0a12; font-family: 'Segoe UI', Arial, sans-serif; }
      .container { max-width: 520px; margin: 40px auto; background: #12121e; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
      .header { background: linear-gradient(135deg, #7c3aed, #a855f7, #c084fc); padding: 32px 40px; text-align: center; }
      .header h1 { color: #fff; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
      .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase; }
      .body { padding: 40px; color: #f0f0f8; }
      .body p { font-size: 15px; line-height: 1.7; color: #8b8ba3; margin-bottom: 20px; }
      .body .name { color: #f0f0f8; font-weight: 600; }
      .btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; }
      .btn-wrap { text-align: center; margin: 30px 0; }
      .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
      .footer p { color: #5a5a78; font-size: 12px; margin: 0; }
      .link { color: #a78bfa; word-break: break-all; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔔 SubSync</h1>
        <p>Subscription Detection System</p>
      </div>
      <div class="body">
        <p>Hi <span class="name">${fullName}</span>,</p>
        <p>Welcome to SubSync! Please verify your email address to activate your account and start tracking your subscriptions.</p>
        <div class="btn-wrap">
          <a href="${verifyLink}" class="btn">✅ Verify My Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">${verifyLink}</p>
        <p>This link will expire in <strong style="color:#f0f0f8">24 hours</strong>.</p>
      </div>
      <div class="footer">
        <p>If you didn't sign up for SubSync, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
  </html>`;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const result = await transporter.sendMail({
        from: `"SubSync" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '✅ Verify your SubSync account',
        html: htmlContent,
      });
      console.log(`✅ Email sent successfully: ${result.messageId}`);
    } catch (emailError) {
      console.error('❌ SMTP Error:', emailError.message);
      throw emailError;
    }
  } else {
    // Fallback: log the link to console
    console.log('\n══════════════════════════════════════════════════');
    console.log('📧  EMAIL VERIFICATION (SMTP not configured)');
    console.log('══════════════════════════════════════════════════');
    console.log(`  To:    ${email}`);
    console.log(`  Name:  ${fullName}`);
    console.log(`  Link:  ${verifyLink}`);
    console.log('══════════════════════════════════════════════════\n');
  }
}

module.exports = { sendVerificationEmail };
