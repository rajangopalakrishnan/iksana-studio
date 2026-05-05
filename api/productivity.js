import connectToDatabase, { Productivity } from '../../lib/models.js';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const data = await Productivity.find();
    res.status(200).json(data);
  } else if (req.method === 'POST') {
    const data = req.body;
    await Productivity.deleteMany();
    await Productivity.insertMany(data);
    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}