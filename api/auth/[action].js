import connectToDatabase, { User } from '../../../lib/models.js';
import { sendEmail } from '../../../lib/mail.js';

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';

export default async function handler(req, res) {
  const { action } = req.query;
  await connectToDatabase();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { email, name, password, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  if (action === 'request-otp') {
    const code = makeOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({
        id: `u${Math.random().toString(36).slice(2, 9)}`,
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'user',
        password: '',
        emailVerified: false,
      });
    } else {
      user.name = user.name || name || normalizedEmail.split('@')[0];
    }

    user.otp = code;
    user.otpExpires = expires;
    user.emailVerified = false;
    await user.save();

    await sendEmail({
      to: normalizedEmail,
      subject: 'Your Iksana Studio verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    return res.status(200).json({ success: true, message: `OTP sent to ${normalizedEmail}` });
  }

  if (action === 'verify-otp') {
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please set a password' });
    }

    const user = await User.findOne({
      email: normalizedEmail,
      otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.emailVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  if (action === 'login') {
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const user = await User.findOne({ email: normalizedEmail, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before signing in' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  return res.status(404).json({ success: false, message: 'Auth action not found' });
}
