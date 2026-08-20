import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
