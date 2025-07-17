import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async (req, res) => {
    const {name , email ,password} = req.body;
    
    if(!name || !email || !password){
        return res.json({success:false,message:'missing details'});
    }

    try{
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false , message: 'User already exists'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({name,email,password: hashedPassword});
        await user.save();

        const token = jwt.sign({id: user._id},process.env.JWT_SECRET, {expiresIn: '1d'});

        res.cookie('token',token,{
            httpOnly:true,
            secure: process.env.NODE_ENV==='production',
            sameSite: process.env.NODE_ENV==='production' ? 'none' : 'strict',
            maxAge : 1*24*60*60*1000  // millisec
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Login Notification',
            text: `Hello ${user.name}, you have successfully logged in with email id:${user.email}.`
        };

        await transporter.sendMail(mailOptions); 

         return res.json({success:true, message: 'Login successful', user: {id: user._id, name: user.name, email: user.email}});
    }catch(error){
        res.json({success:false , message: error.message});
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success:false, message: 'Email and password are required'});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false, message: 'Invalid Email'});
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.json({success:false,message:'Invalid Password'});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});

        res.cookie('token',token,{
                httpOnly:true,
                secure: process.env.NODE_ENV==='production',
                sameSite: process.env.NODE_ENV==='production' ? 'none' : 'strict',
                maxAge : 1*24*60*60*1000  // millisec
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Login Notification',
            text: `Hello ${user.name}, you have successfully logged in with email id:${user.email}.`
        };

        await transporter.sendMail(mailOptions); 

        return res.json({success:true, message: 'Login successful', user: {id: user._id, name: user.name, email: user.email}});

    }catch(error){
        return res.json({success:false, message: error.message});
    }

    

   
}


export const logout = async (req, res) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });
    }catch(error){
        return res.json({success: false, message: error.message});
    }
    return res.json({success: true, message: 'Logout successful'});
}

// send verification email to user's email
export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await userModel.findById(userId); 

        if(user.isAccountVerified){
            return res.json({success: false, message: 'Account already verified'});
        }

        const otp = String(Math.floor(100000 + Math.random()*900000)); // generate 6 digit OTP
        user.verifyOtp = otp; 
        user.verifyOtpExpireAt = Date.now() + 24*60*60*1000  // milliseconds

        await user.save();

        const mailOptions ={
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            // text: `Your OTP for account verification is: ${otp}. Please use this to verify your account using this OTP.`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

        await transporter.sendMail(mailOptions);

        res.json({success: true, message: 'OTP sent to your email', userId: user._id});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}


// verify email using OTP
export const verifyEmail = async (req, res) => {
    try {
        // const {userId, otp} = req.body;
        const userId = req.userId;
        const otp = req.body.otp;

        if(!userId || !otp){
            return res.json({success: false, message: 'Missing userId or OTP'});
        }

        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: 'User not found'});
        }

        if(user.verifyOtp === ''  || user.verifyOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'});
        }
        
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP expired'}); 
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: 'Account verified successfully'});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try{
        return res.json({success: true, message: 'User is authenticated', userId: req.userId});
    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

// Send reset password OTP

export const sendResetOtp = async (req, res) => {
    const {email} = req.body;
    if(!email){
        return res.json({success: false, message: 'Email is required'});
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000)); // generate 6 digit OTP
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes in milliseconds
        
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `Your OTP for password reset is: ${otp}. Please use this to reset your password.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'OTP sent to your email' });

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Reset password using OTP
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Missing email, OTP or new password' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (user.resetOtp ==="" || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}