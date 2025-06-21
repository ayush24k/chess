import express from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';

const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
    res.send("server is up and working")
})

const server = app.listen(PORT, () => {
    console.log(`Server Running on Port: ${PORT} \nlink: http://localhost:${PORT}`)
})

const webSocketServer = new WebSocketServer({ server })

const gameManager = new GameManager();

webSocketServer.on('connection', (ws) => {
    console.log(`Connection Initiliased!`);

    try {
        gameManager.addUser(ws)
    } catch (err) {
        console.log("rrror adding the user in game:", err);
    }

    ws.on('close', () => {
        gameManager.removeUser(ws);
    })
    
})