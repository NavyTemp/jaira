import mongoose from 'mongoose';

const connectiondB = async () => {
  console.log('Trying to connect...');

  try {
    console.log(process.env.DB_URL);

    await mongoose.connect(process.env.DB_URL);

    console.log(`DB connected successfully 🚀  in pot ${process.env.port}`);
  } catch (error) {
    console.log('DB connection failed ❌');
    console.log(error.message);
  }
};

export default connectiondB;
