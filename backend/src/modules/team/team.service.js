import TeamModel from "../../models/team.model.js";

export const createTeam = async (req, res, next) => {
  const { name, description, membersId, tasksId, chatId } = req.body;
  const ownerId = req.user._id;
  try {
    const team = new TeamModel({
      name,
      description,
      ownerId,
      members: membersId.map((memberId) => ({ user: memberId })),
      tasksId,
      chat: chatId,
    });
    await team.save();
    return res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    return next(error);
  }
};
