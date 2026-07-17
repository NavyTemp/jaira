import activityModel from "../models/activity.model.js";

export const createActivity = async ({
  team,

  task,

  user,

  action,

  metadata = {},
}) => {
  const activity = await activityModel.create({
    team,

    task,

    user,

    action,

    metadata,
  });

  return activity;
};
