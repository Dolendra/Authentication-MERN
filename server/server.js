import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';  // Import the connectDB function
import authRouter from './routes/authRoutes.js';  // Import the authR
import userRouter from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:'http://localhost:5173',
  credentials: true
}));


//API Endpoints
app.get('/', (req, res) => {
  res.send('Welcome to the Auth Server');
});
app.use('/api/auth',authRouter);
app.use('/api/user', userRouter);  // Add user routes

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

