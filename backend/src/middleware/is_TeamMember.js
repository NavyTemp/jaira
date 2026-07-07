

export const is_TeamMember = (req, res, next) => {
  try {
    const teamId = req.body.team || req.params.id;
    const userId = req.user._id;

    const team = TeamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }
    const is_Member = team.members.some(
      (m) => m.user.toString() === userId.toString(),
    );
    if (!is_Member) {
      return res
        .status(403)
        .json({ message: "you are not a member of this team" });
    }

    req.next = team;
    req.mumber_roul = is_Member.role;
    next();
  } catch (error) {
    return next(error);
  }
};
