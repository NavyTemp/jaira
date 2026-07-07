
import cors from "cors"
import express from "express"

import connectiondB from "./DB/connection.js"
import userRoutr from "./modules/user.controller.js"
import teamRouter from "./modules/team/team.controller.js"
import taskRouter from "./modules/Task/task.controller.js"

const bootstrap = (app, port) => {
  app.use(cors())
  app.use(express.json())

  app.get("/", (req, res) => {
    return res.status(200).json({
      message: `Task Management System API running on port ${port}`,
    })
  })

  connectiondB()

  app.use("/users", userRoutr)
  app.use("/teams", teamRouter)
  app.use("/tasks", taskRouter)

  app.use((req, res) => {
    return res
      .status(404)
      .json({ message: `URL not found: ${req.originalUrl}` })
  })

  app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500
    return res.status(status).json({
      message: err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    })
  })
}

export default bootstrap
