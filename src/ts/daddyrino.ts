let lineNumber = 0;
const addChatline = ({highlight, channelName, timestamp, badges, username, message}) => {
    const inv = (lineNumber++ % 2 == 0);
    let chatClass = inv ? 'chat-message-inv' : 'chat-message';
    if(highlight) { chatClass += ' highlight'; }
    $('#chat-container').append(`
    <div class="${chatClass}">
        <span class="mod-buttons">X</span>
        <span class="channel-name">#${channelName}</span>
        <span class="timestamp">${timestamp}</span>
        <span class="badges">${badges.map((badge) => `<img src="${badge}"/>`).join('')}</span>
        <span class="username">${username}</span>
        <span class="message">${message}</span>
    </div>
    `)
    $('#chat-container').scrollTop($('#chat-container').height()!);
}

const ffzEmoteLink = (emoteId: string) => `https://cdn.frankerfacez.com/emote/${emoteId}/4`;
const bttvEmoteLink = (emoteId: string) => `https://cdn.betterttv.net/emote/${emoteId}/3x`;
const makeImg = (src: string) => `<img src="${src}"/>`;
const twitchBadge = (badgeId: string) => `https://static-cdn.jtvnw.net/badges/v1/${badgeId}/1`

const addRandomChatline = () => {
    if(lineNumber > 50) {return; }
    const highlight = false;
    const channelName = 'danielrx_';
    const ts = new Date();
    const timestamp = `${ts.getHours()}:${ts.getMinutes()}`;
    const badges = [twitchBadge('e68164e4-087d-4f62-81da-d3557efae3cb')];
    const username = 'DanielRX_';
    addChatline({highlight, channelName, timestamp, badges, username, message: makeImg(ffzEmoteLink('270930'))});
    addChatline({highlight: false, channelName, timestamp, badges, username, message:  `Chat ${makeImg(bttvEmoteLink("5d7eefb7c0652668c9e4d394"))}`});
}


window.onload = () => {
    const init = () => {
        setInterval(addRandomChatline, 1000);
    };
    setTimeout(init, 1000);
};
