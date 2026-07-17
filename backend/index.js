
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path:path.resolve("src/config/.env")});
import Http from 'http'

import express from 'express'
import bootstrap from './src/app.controller.js'
import { initSocket } from './src/sockets/socket.js';


const app = express()
const port = process.env.port
bootstrap(app,port)




const server= Http.createServer(app)
initSocket(server)
server.listen(port, () => console.log(`Server is running on port: ${port}`));



