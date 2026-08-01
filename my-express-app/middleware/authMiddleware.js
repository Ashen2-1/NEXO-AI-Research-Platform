import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "No token provided",
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            error: "No token provided",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.userId) {
            return res.status(401).json({
                error: "Invalid token payload",
            });
        }

        req.user = {
            id: String(decoded.userId),
            email: decoded.email || null,
        };

        next();
    } catch (error) {
        // 只记录错误类型，绝对不要记录 JWT token
        console.warn(
            "Authentication failed:",
            error.name
        );

        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};

export default authMiddleware;