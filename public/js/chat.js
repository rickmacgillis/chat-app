const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageTextbox = $messageForm.querySelector('#message-box');
const $messageButton = $messageForm.querySelector('#message-button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $locationTemplate = document.querySelector('#location-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {

    const $newMessage = $messages.lastElementChild;
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;
    const containerHeight = $messages.scrollHeight;
    const scrollOffset = $messages.scrollTop + visibleHeight;

    const shouldAutoscroll = containerHeight - newMessageHeight <= scrollOffset;
    if (shouldAutoscroll) {
        $messages.scrollTop = $messages.scrollHeight;
    }

};

socket.on('message', (message) => {
    
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

});

socket.on('locationMessage', (message) => {
    
    const html = Mustache.render($locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

});

socket.on('roomData', ({ room, users }) => {
    
    const html = Mustache.render($sidebarTemplate, { room, users });
    $sidebar.innerHTML = html;

});

$messageForm.addEventListener('submit', (event) => {

    event.preventDefault();

    $messageButton.setAttribute('disabled', 'disabled');

    const message = $messageTextbox.value;
    socket.emit('sendMessage', message, (error) => {

        if (error !== undefined) {
            console.log(error);
        } else {
            console.log('The message was delivered.');
        }

        $messageButton.removeAttribute('disabled');
        $messageTextbox.value = '';
        $messageTextbox.focus();

    });

});

$locationButton.addEventListener('click', () => {

    const geo = navigator.geolocation;
    if (geo === undefined) {
        return alert('Geolocation is not supported by your browser.');
    }

    $locationButton.setAttribute('disabled', 'disabled');

    geo.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, () => {

            console.log('Location shared!');
            $locationButton.removeAttribute('disabled');
    
        });

    });

});

socket.emit('join', { username, room }, (error) => {

    if (error !== undefined) {
        
        alert(error);
        location.href = '/';

    }

});
