const express = require("express");
const path = require("path");
const http = require("http");
const {
    generateMessages,
    generateLocationMessages,
} = require("./utils/messages");
const socketio = require("socket.io");

const {
    addUser,
    removeUser,
    getUser,
    getUserInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");
app.get("/index", (req, res) => {
    res.render("index");
});

app.use(express.static(publicDirectoryPath));

// let count = 0;
// const users = [];

io.on("connection", (socket) => {
    console.log("New WebSocket Connection");

    socket.on("join", ({ username, room }, callback) => {
        // const userId = socket.id;
        const { error, user } = addUser({ id: socket.id, username, room });
        // console.log(users);
        // console.log("room :", user);
        // console.log("error", error);
        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        io.to(user.room).emit("roomData", getUserInRoom(user.room));

        socket.emit("message", generateMessages("Admin", "Welcome !"));
        socket
            .to(user.room)
            .broadcast.emit(
                "message",
                generateMessages(
                    "Admin",
                    `${user.username} has joined the room`
                )
            );

        callback();
    });

    socket.on("sendMessage", (msg) => {
        console.log(msg);
        const user = getUser(socket.id);
        io.to(user.room).emit("message", generateMessages(user.username, msg));
    });

    socket.on("disconnect", () => {
        console.log("Disconnected");
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessages("Admin", `${user.username} has left the room`)
            );
            io.to(user.room).emit("roomData", getUserInRoom(user.room));
        }
    });

    socket.on("sendLocation", (location, callback) => {
        const user = getUser(socket.id);
        io.emit(
            "locationMessage",
            generateLocationMessages(
                user.username,
                `https://google.com/maps?q=${location.latitude},${location.longitude}`
            )
        );
        callback("location shared");
    });
});

server.listen(process.env.PORT, () => {
    console.log(`App started on port ${process.env.PORT}`);
});
