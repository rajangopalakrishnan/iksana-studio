import connectToDatabase, { Task, Engineer } from '../../lib/models.js';
import { sendEmail } from '../../lib/mail.js';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const data = await Task.find();
    res.status(200).json(data);
  } else if (req.method === 'POST') {
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

    res.status(200).json({ success: true, notified: assignments.length });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}