require('./web');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});
const urlForStop = "https://lad.lviv.ua/api/stops";
const request = require("request-promise");
const vehicles = {"bus": "Авт.", "trol": "Трл.", "tram": "Трм."};
const DIVIDER = "-".repeat(30) + "\n";

class LadClient {
    constructor(){
        const baseUrl = "https://lad.lviv.ua/api"
        this.stopsUrl = baseUrl + "/stops"
        this.closestUrl = baseUrl + "/closest"
    }

    async getStop(stopId) {
        const body = await request.get(this.stopsUrl + '/' + stopId)
        return JSON.parse(body)
    }

    async getClosest(lat, lng) {
        const body = await request.get({
            uri: this.closestUrl,
            qs: {longitude: lng, latitude: lat}
        })
        return JSON.parse(body)
    }
}
const ladClient = new LadClient()

async function respondWithNum(bot, chatId, stopId) {
    const sentMsg = await bot.sendMessage(
        chatId,
        "Отримую розклад........"
    )
    let information = "";
    try {
        const data = await ladClient.getStop(stopId)
        information += "Зупинка N " + data["code"] + '\n' + data["name"] + '\n';
        if(data["timetable"]===0) {
            information += "\nНа жаль, на потрібному маршруті зараз немає транспорту. Будь ласка, виберіть інший маршрут.";
        }
        else {
            information +="\nТранспорт:\n";
            information += DIVIDER;
            data["timetable"].forEach((row) => {
                let transportType = vehicles[row["vehicle_type"]];
                let routeName = row["route"];
                let endStop = row["end_stop"];
                let timeLeft = row["time_left"];

                information += `${transportType}   "${routeName}"   ${endStop}   ${timeLeft}\n`;
                information += DIVIDER;
            })
        }
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
    const data = await ladClient.getClosest(lat, lng)
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
