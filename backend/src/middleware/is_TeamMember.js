import TeamModel from "../models/team.model.js";

export const is_TeamMember = async (req, res, next) => {
  try {
    const teamId = req.body.team || req.params.id;
    const userId = req.user._id;

    const team = await TeamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    const membership = team.members.find(
      (m) => m.user.toString() === userId.toString(),
    );
    if (!membership) {
      return res
        .status(403)
        .json({ message: "you are not a member of this team" });
    }

    req.team = team;
    req.memberRole = membership.role;
    next();
  } catch (error) {
    return next(error);
  }
};
