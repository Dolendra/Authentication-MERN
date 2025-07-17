import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded?.id){
            req.userId = decoded.id; // Attach user ID to request body
            next(); // Proceed to the next middleware or route handler
        }

        else{
            return res.status(401).json({ success: false, message: 'Invalid token Not Authorized Login Again' });
        }


    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

export default userAuth;