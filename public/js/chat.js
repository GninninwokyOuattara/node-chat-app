const socket = io();

const $sendLocationButton = document.querySelector("#send-location");
const $message = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

//autoscroll method
const autoscroll = () => {
    const newMessage = $message.lastElementChild;

    //newMessageHeight
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageHeight =
        newMessage.offsetHeight + parseInt(newMessageStyles.marginBottom);

    //visible Height
    const visibleHeight = $message.offsetHeight;

    //messages container height
    const ContainerHeight = $message.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $message.scrollTop + visibleHeight;

    if (ContainerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight;
    }
};

socket.on("updatedCount", (count) => {
    console.log("Count has been updated", count);
});

socket.on("message", (message) => {
    console.log(message.text);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });
    $message.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (data) => {
    console.log(location);
    console.log(data.username);
    const html = Mustache.render(locationTemplate, {
        username: data.username,
        url: data.url,
        createdAt: moment(data.createdAt).format("h:mm a"),
    });
    $message.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", (roomData) => {
    console.log(roomData);
    const http = Mustache.render(sidebarTemplate, {
        room: room,
        username: username,
        users: roomData,
    });

    $sidebar.innerHTML = http;
});

document.querySelector("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.querySelector("input").value;

    e.target.elements.message.value = "";
    socket.emit("sendMessage", msg);
});

$sendLocationButton.addEventListener("click", (e) => {
    if (!navigator.geolocation) {
        return alert("Unable to fetch user location");
    }

    //disabled
    $sendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position.coords.latitude);
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            (msg) => {
                console.log(msg);
                //enabled
                $sendLocationButton.removeAttribute("disabled");
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
