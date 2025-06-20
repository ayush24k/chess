import express from 'express';
import {WebSocketServer} from 'ws';

const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
    res.send("server is up and working")
})

const server = app.listen(PORT, () => {
    console.log(`Server Running on Port: ${PORT} \nlink: http://localhost:${PORT}`)
})

const webSocketServer = new WebSocketServer({server})

webSocketServer.on('connection', (ws) => {
    console.log(`Connect Initiliased!`);
    ws.on('error', (err)=> {
        console.log("errro", err);
    })

    ws.on('message', async (message) => {
        const msg = message.toString('utf-8');
        console.log(msg);
    })
})