import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Schemas
const engineerSchema = new mongoose.Schema({
  id: String,
  name: String,
  role: String,
  location: String,
  active: Boolean,
  email: String,
  rate: Number,
});

const projectSchema = new mongoose.Schema({
  id: String,
  name: String,
  client: String,
  region: String,
  status: String,
  budget: Number,
  startDate: String,
  endDate: String,
});

const taskSchema = new mongoose.Schema({
  id: String,
  projectId: String,
  title: String,
  assignee: String,
  status: String,
  priority: String,
  estimatedHours: Number,
  loggedHours: Number,
  dueDate: String,
  createdAt: String,
  discipline: String,
  onHoldComments: String,
});

const productivitySchema = new mongoose.Schema({
  discipline: String,
  unit: String,
  rate: Number,
});

const attendanceSchema = new mongoose.Schema({
  id: String,
  engineerId: String,
  date: String,
  checkIn: String,
  checkOut: String,
  type: String,
  notes: String,
});

const leaveSchema = new mongoose.Schema({
  id: String,
  engineerId: String,
  startDate: String,
  endDate: String,
  type: String,
  reason: String,
  status: String,
});

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  role: String,
  password: String,
});

// Models
const Engineer = mongoose.model('Engineer', engineerSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Productivity = mongoose.model('Productivity', productivitySchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Leave = mongoose.model('Leave', leaveSchema);
const User = mongoose.model('User', userSchema);

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
  await Task.deleteMany();
  await Task.insertMany(data);
  res.json({ success: true });
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