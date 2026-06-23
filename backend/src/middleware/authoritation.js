export const authorization = (accessRoles = []) => {
  const roles = Array.isArray(accessRoles) ? accessRoles : [accessRoles];
  return (req, res, next) => {
    if (!roles.includes(req?.user?.role)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    return next();
  };
};