const { Telegraf } = require('telegraf');
const Telegram = require('telegraf/telegram');
const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
//const express = require("express");
const fastify = require('fastify');
const middie = require('middie');
require('./setEnv');

const { DEFAULT_BUTTONS } = require('./constants.js');

const {
  addRoomHandler,
  adminActionsHandler,
  joinRoomHandler,
} = require('./handlers/index.js');
const joinRoomScene = require('./scenes/joinRoomScene');
const assignRecipientsScene = require('./scenes/assignRecipientsScene');

const { BOT_TOKEN, BOT_USERNAME, PORT, WEB_HOOK_URL_BASE, WEB_HOOK_SECRET } =
  process.env;

const IS_TEST = process.env.IS_TEST === 'true';

const SESSION_STATE = {
  isAdmin: false,
};

const start = async () => {
  console.log('BOT_TOKEN', BOT_TOKEN);

  const fastifyInstance = fastify();
  try {
    await fastifyInstance.register(middie);

    const telegram = new Telegram(BOT_TOKEN);

    const stage = new Stage([joinRoomScene, assignRecipientsScene], {
      ttl: 120,
    });

    let state = { subscribers: [] };

    const bot = new Telegraf(BOT_TOKEN, {
      username: BOT_USERNAME,
      // Telegram options
      agent: null,
      webhookReply: false,
    }); // https.Agent instance, allows custom proxy, certificate, keep alive, etc. // Reply via webhook

    // bot.telegram.setWebhook(`${WEB_HOOK_URL_BASE}${WEB_HOOK_SECRET}`);

    // fastifyInstance.use(bot.webhookCallback(WEB_HOOK_SECRET));

    bot.use(session());
    bot.use(stage.middleware());

    bot.launch();

    bot.start((ctx) => {
      ctx.reply(
        'Привет, я бот для проведения игры Тайный Санта 🎅, с помощью кнопок внизу выбери, хочешь ли создать новую комнату или присоедниться к существующей 👇',
        Markup.keyboard([
          Object.values(DEFAULT_BUTTONS).map((btn) => btn.text), // Row1 with 2 buttons
        ])
          .oneTime()
          .resize()
          .extra(),
      );
    });

    bot.hears('check', async (ctx) => {
      console.log('check');
      await ctx.reply("what's up");
    });

    addRoomHandler(bot);
    joinRoomHandler(bot);
    adminActionsHandler(bot);

    fastifyInstance.get('/', (req, reply) => reply.send('Hello World!'));

    fastifyInstance.listen(Number(PORT), '0.0.0.0', async (error) => {
      if (error) {
        console.log('Error when starting the server', error);
      }
      console.log(`app listening on port ${PORT}!`);
    });
  } catch (e) {
    console.error('error when running start', e);
  }
};

start();
