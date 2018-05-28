const request = require("request-promise");
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

module.exports = LadClient