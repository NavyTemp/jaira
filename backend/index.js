
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path:path.resolve("src/config/.env")});
import express from 'express'
import bootstrap from './src/app.controller.js'


const app = express()
const port = 3000
bootstrap(app,port)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))



