import mongoose from 'mongoose';

// Подключение к MongoDB вынесено отдельно, чтобы сервер и seed-скрипт использовали одну функцию.
export async function connectToDatabase(uri: string): Promise<void> {
  if (!uri) {
    throw new Error('Не задана строка подключения MONGO_URI');
  }

  await mongoose.connect(uri);
  console.log('MongoDB подключена');
}
