import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectToDatabase, { Engineer, Project, Task, Productivity, Attendance, Leave, User } from './lib/models.js';
import { sendEmail } from './lib/mail.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await connectToDatabase();

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

app.post('/api/auth/:action', async (req, res) => {
  const { action } = req.params;
  const { email, name, password, otp } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  if (action === 'request-otp') {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = new User({
        id: `u${Math.random().toString(36).slice(2, 9)}`,
        name,
        email: normalizedEmail,
        role: 'user',
        password: '',
        emailVerified: false,
      });
    } else {
      user.name = user.name || name;
    }

    user.otp = makeOtp();
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailVerified = false;
    await user.save();

    await sendEmail({
      to: normalizedEmail,
      subject: 'Your Iksana Studio verification code',
      text: `Your verification code is ${user.otp}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${user.otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
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
    return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  return res.status(404).json({ success: false, message: 'Auth action not found' });
});

// Routes
app.get('/api/engineers', async (req, res) => {
  const data = await Engineer.find();
  res.json(data);
});

app.post('/api/engineers', async (req, res) => {
  const data = req.body;
  await Engineer.deleteMany();
  await Engineer.insertMany(data);
  res.json({ success: true });
});

app.get('/api/projects', async (req, res) => {
  const data = await Project.find();
  res.json(data);
});

app.post('/api/projects', async (req, res) => {
  const data = req.body;
  await Project.deleteMany();
  await Project.insertMany(data);
  res.json({ success: true });
});

app.get('/api/tasks', async (req, res) => {
  const data = await Task.find();
  res.json(data);
});

app.post('/api/tasks', async (req, res) => {
  const data = req.body;
  const previousTasks = await Task.find().lean();
  const previousMap = new Map(previousTasks.map(task => [task.id, task]));
  const assignments = data.filter(task => {
    const previous = previousMap.get(task.id);
    return task.assignee && (!previous || previous.assignee !== task.assignee);
  });

  await Task.deleteMany();
  await Task.insertMany(data);

  await Promise.all(assignments.map(async (task) => {
    const engineer = await Engineer.findOne({ id: task.assignee });
    if (!engineer?.email) return;
    await sendEmail({
      to: engineer.email,
      subject: `New IKSANA task assigned: ${task.title}`,
      text: `A new task has been assigned to you:\n\n${task.title}\nStatus: ${task.status}\nProject: ${task.projectId || 'N/A'}\n\nPlease sign in to your IKSANA dashboard to view the details.`,
      html: `<p>A new task has been assigned to you:</p><p><strong>${task.title}</strong></p><p>Status: ${task.status}</p><p>Project: ${task.projectId || 'N/A'}</p><p>Please sign in to your IKSANA dashboard to view the details.</p>`,
    });
  }));

  res.json({ success: true, notified: assignments.length });
});

app.get('/api/productivity', async (req, res) => {
  const data = await Productivity.find();
  res.json(data);
});

app.post('/api/productivity', async (req, res) => {
  const data = req.body;
  await Productivity.deleteMany();
  await Productivity.insertMany(data);
  res.json({ success: true });
});

app.get('/api/attendance', async (req, res) => {
  const data = await Attendance.find();
  res.json(data);
});

app.post('/api/attendance', async (req, res) => {
  const data = req.body;
  await Attendance.deleteMany();
  await Attendance.insertMany(data);
  res.json({ success: true });
});

app.get('/api/leaves', async (req, res) => {
  const data = await Leave.find();
  res.json(data);
});

app.post('/api/leaves', async (req, res) => {
  const data = req.body;
  await Leave.deleteMany();
  await Leave.insertMany(data);
  res.json({ success: true });
});

app.get('/api/users', async (req, res) => {
  const data = await User.find();
  res.json(data);
});

app.post('/api/users', async (req, res) => {
  const data = req.body;
  await User.deleteMany();
  await User.insertMany(data);
  res.json({ success: true });
});

app.get('/api/currentUser', async (req, res) => {
  // For simplicity, return null or handle session
  res.json(null);
});

app.post('/api/currentUser', async (req, res) => {
  // Handle login
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));