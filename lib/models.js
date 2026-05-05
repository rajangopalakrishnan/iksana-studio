import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

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
export const Engineer = mongoose.models.Engineer || mongoose.model('Engineer', engineerSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export const Productivity = mongoose.models.Productivity || mongoose.model('Productivity', productivitySchema);
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default connectToDatabase;