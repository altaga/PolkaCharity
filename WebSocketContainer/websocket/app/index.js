
// Importing the required modules
const WebSocketServer = require('ws');

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 1883 })

// Creating connection using websocket
wss.on("connection", ws => {
    ws.on("message", data => {
        if (data.toString() === "ping") {
            ws.send("pong")
        }
        else {
            wss.clients.forEach((client) => {
                client.send(`${data}`);
            })
        }
    });

    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        console.log("the client has connected");
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred")
    }
});

console.log("The WebSocket server is running on port 1883");