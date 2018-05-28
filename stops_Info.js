const vehicles = {"bus": "Авт.", "trol": "Трл.", "tram": "Трм."};
const DIVIDER = "-".repeat(30) + "\n";

class StopsInfo {
    constructor(ladClient)
    {
        this.ladClient=ladClient
    }
    async getStop(stopId)
    {
        const data = await this.ladClient.getStop(stopId)
        let information = "Зупинка N " + data["code"] + '\n' + data["name"] + '\n';
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
        return information
    }
    async getClosest(lat,lng){
        return await this.ladClient.getClosest(lat, lng)
    }
}
module.exports = StopsInfo