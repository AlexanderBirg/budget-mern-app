import 'dotenv/config';
import { createApp } from './app.js';
import { connectToDatabase } from './db/connect.js';

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/budget_app';

await connectToDatabase(mongoUri);

const app = createApp();
app.listen(port, () => {
  console.log(`API запущен: http://localhost:${port}`);
});
