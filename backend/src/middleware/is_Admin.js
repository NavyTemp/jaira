export const isTeamAdmin = (req, res, next) => {
  try {
    if (req.memberRole !== "admin") {
      return res.status(403).json({
        message: "only team admin/leader can do this action",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};