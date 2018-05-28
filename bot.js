const TelegramBot = require('node-telegram-bot-api');
const LadClient = require('./lad_client')
const StopsInfo = require('./stops_Info')

const ladClient = new LadClient()
const stopsInfo = new StopsInfo(ladClient)
const token = process.env.TOKEN
const bot = new TelegramBot(token, {polling: true});

async function respondWithNum(bot, chatId, stopId) {
    const sentMsg = await bot.sendMessage(
        chatId,
        "Отримую розклад........"
    )
    let information = "";
    try {
        information=await stopsInfo.getStop(stopId)
    } catch (e) {
        console.log(e)
        information = "Такої зупинки не існує. Введіть правильний номер зупинки."
    }

    bot.editMessageText(
        information,
        {
            message_id: sentMsg.message_id,
            chat_id: sentMsg.chat.id
        }
    )
}
async function respondWithClosest(bot, chatId, lat, lng) {
    const data = await stopsInfo.getClosest(lat, lng)
    const keyboard = data.map((stop) =>
        [{text: stop.name + ' #' + stop.code, callback_data: stop.code }]
    );
    bot.sendMessage(
        chatId,
        'Виберіть найближчу зупинку: ',
        {
            reply_markup: { inline_keyboard: keyboard }
        }
    )
}
bot.on('location', (msg) => {
    respondWithClosest(
        bot,
        msg.chat.id,
        msg.location.latitude,
        msg.location.longitude
    )
})
bot.onText(/\/start.*/, (msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        'Доброго дня!',
        {
            reply_markup: {
                resize_keyboard: true,
                keyboard: [
                    [{text: 'Надіслати локацію', request_location: true }]
                ]
            }
        }
    );
})
bot.onText(/\/num (.+)/, (msg, match) => {
    let stopId = match[1]

    respondWithNum(bot, msg.chat.id, stopId)
})
bot.on('callback_query', (callbackQuery) => {
    const stopId = callbackQuery.data
    const chatId = callbackQuery.message.chat.id

    respondWithNum(bot, chatId, stopId)
})
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
})
