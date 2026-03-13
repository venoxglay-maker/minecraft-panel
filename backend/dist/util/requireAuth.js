import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const token = auth.substring("Bearer ".length);
        const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme");
        req.userId = payload.sub;
        next();
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
