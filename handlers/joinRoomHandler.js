const { DEFAULT_BUTTONS, SCENES } = require('../constants.js');

const joinRoomHandler = (bot) => {
  bot.hears(DEFAULT_BUTTONS.joinRoom.text, (ctx) => {
    ctx.scene.enter(SCENES.joinRoom);
  });
};

module.exports = joinRoomHandler;
