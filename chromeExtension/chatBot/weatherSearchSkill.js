/**
 * 都市名・時間に応じて、現在の天気や天気予報を取得する
 * hours=0なら現在の天気、1~120なら3時間単位の精度となる
 * @param {number} hours - 何時間先の天気を知りたいか、0だと現在の天気
 * @param {string} location - 知りたい天気の都市名
 * @return {string} Thunderstorm, Drizzle, Rain, Snow, Atmosphere, Clear, Clouds, ERRORのいずれか
 */
function getWeatherByCityName(hours, location) {
    const API_KEY = "aac4c76332d0c2b3c263a2c729a36505";

    // npm install openweathermap-node
    const OpenWeatherMapHelper = require("openweathermap-node");
    const helper = new OpenWeatherMapHelper(
        {
            APPID: API_KEY,
            units: "metric"
        }
    );

    // get current weather data
    if (hours === 0) {
        return getCurrentWeather(location);
    }

    // get 5days weather forecast
    if (hours > 0 && hours < 120) {
        return getWeatherForcast(hours, location);
    }

    // if hours<0 or hours>=120
    console.log("Weather forecast needs to be less than 120 hours");
    return "ERROR";

    function getCurrentWeather(location) {
        helper.getCurrentWeatherByCityName(location, (err, currentWeather) => {
            if(err){
                console.log(err);
                return "ERROR";
            }
            else{
                return currentWeather["weather"][0]["main"];
            }
        });
    }

    function getWeatherForcast(hours, location) {
        helper.getThreeHourForecastByCityName(location, (err, threeHourForecast) => {
            if(err){
                console.log(err);
                return "ERROR";
            }
            else{
                return threeHourForecast["list"][Math.floor(hours/3)]["weather"][0]["main"];
            }
        });
    }
    
}
