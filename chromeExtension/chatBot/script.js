/**
 * 都市名・時間に応じて、現在の天気や天気予報を取得する
 * hours=0なら現在の天気、1~120なら3時間単位の精度となる
 * @param {number} hours - 何時間先の天気を知りたいか、0だと現在の天気
 * @param {string} location - 知りたい天気の都市名
 * @return {string} 天気：Thunderstorm, Drizzle, Rain, Snow, Atmosphere, Clear, Clouds
 */
async function getWeatherByCityName(hours,cityName) {

    const API_KEY = 'aac4c76332d0c2b3c263a2c729a36505';
    if (hours === 0) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${
        cityName}&appid=${API_KEY}`;
        const result = await fetch(url);
        const resultJSON = await result.json();
        // 取得できたJSONファイルの確認用
        //console.log(resultJSON.weather[0].main);
        //document.querySelector('.result').innerText =
        //`current weather in ${cityName} is ${resultJSON.weather[0].main} !`;
        return(resultJSON.weather[0].main);
    }
    if (hours > 0 && hours < 120) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${
        cityName}&appid=${API_KEY}`;
        const result = await fetch(url);
        const resultJSON = await result.json();
        return(resultJSON.list[Math.floor(hours/3)].weather[0].main);
    }
    return;
}

const getWeather = async (hours, cityName) => {
    return await getWeatherByCityName(hours, cityName);
}


// 形態素解析に用いるオブジェクトを生成
const builder = kuromoji
  .builder({ dicPath: "./node_modules/kuromoji/dict" })

// 天気として反応する単語リスト
const weathers = { weather:'天気',
                   Clear:'晴れ',
                   Clouds:'曇り',
                   Rain: '雨',
                   Snow:'雪',
                   Thunderstorm: '雷雨',
                   Drizzle: '霧雨',
                   Atmosphere: '大気'
                 };

// 都市名として反応する単語リスト
const regions = { Hokkaido:'北海道',
                  Tokyo:'東京',
                  Osaka:'大阪',
                  Kyoto:'京都',
                  Okinawa:'沖縄'
                 };

/**
 * 質問に関して何かしら回答する関数
 * @param {string} sentence - 質問文
 * @return {string} 回答
 */
async function questionAnswering(sentence) {
    // 天気について聞かれているかどうか
    if (await isWeahterQuestion(sentence)) {
        return await weatherQuestionAnswering(sentence);
    } else {
        // どの条件にも当てはまらなかった場合の返答
        return await nothingQuestionAnswering(sentence);
    }
}


/**
 * どの条件にも当てはまらなかった場合の返答
 * @param {string} sentence 質問文
 * @return {string} 回答
 */
async function nothingQuestionAnswering(sentence) {
    let answer;
    return new Promise((resolve, reject) => {
        answer = 'すみませんわん。よくわかりませんでしたわん。';
        console.log( `返答：${answer}`)
        resolve(answer)
    });
}


/**
 * 天気について聞いているかどうかを判定
 * @param {string} sentence - 質問文
 * @return {boolean} 正しく聞かれている場合true
 */
async function isWeahterQuestion(sentence) {
    return new Promise((resolve, reject) =>
        builder.build(function (err, tokenizer) {
            if (err) {
                reject(err);
                return;
            }
            const tokens = tokenizer.tokenize(sentence);
            //console.dir(tokens); // 形態素解析結果を表示
            let weatherWordExists = false;
            let timeExists = false;
            let regionExists = false;
            
            const tokensTrans = tokens.map((token) => {
                // ##--- transform rule ---##
                // 天気の単語があるかどうか
                if (Object.values(weathers).includes(token.surface_form)) weatherWordExists = true;

                // 時間関連の副詞があるかどうか
                if (token.pos_detail_1 === "副詞可能") timeExists = true;

                // 地域の固有名詞があるかどうか
                //if (token.pos_detail_1 === "固有名詞" && token.pos_detail_2 === "地域") {} での絞り込みも可能
                if (Object.values(regions).includes(token.surface_form)) regionExists = true;

                return token.surface_form;
            });

            console.log(`天気：${weatherWordExists}  時間：${timeExists} 地域：${regionExists}`);
            console.log(`天気かどうか判定: ${weatherWordExists && timeExists && regionExists}`);
            resolve(weatherWordExists && timeExists && regionExists);
        })
    );
}


/**
 * 天気予報の結果の返信を行う
 */
async function weatherQuestionAnswering(sentence){
    let answer; // 返答用文章を格納
    return new Promise((resolve, reject) =>
        builder.build(function (err, tokenizer) {
            if (err) {
                reject(err);
                return;
            }

            const tokens = tokenizer.tokenize(sentence);
            //console.dir(tokens); // 形態素解析結果を表示
            let timeWord;
            let regionWord;
            let hours; // 何時間後の予報が欲しいか
            
            const tokensTrans = tokens.map((token) => {
                // ##--- transform rule ---##
                // 時間の副詞を抽出
                if (token.pos_detail_1 === "副詞可能") timeWord = token.surface_form;
                // 地域の固有名詞を抽出
                if (Object.values(regions).includes(token.surface_form)) regionWord = token.surface_form;
                return token.surface_form;
            });
            // 時間の副詞 -> 何時間後 に変換
            switch(timeWord) {
                case "今日":
                case "今":
                case "いま":
                    hours = 0;
                    break;
                case "明日":
                    hours = 24;
                    break;
                case "明後日":
                case "あさって":
                    hours = 36;
                    break;
            }

            // 地域を 漢字 -> ローマ字に変換
            const cityName = Object.keys(regions).filter( (key) => { 
                return regions[key] === regionWord;
            });

            // 時間と都市名から天気を取得する
            getWeather(hours, cityName).then(result =>{
                console.log(result)
                // 天気を 英語 -> 日本語に変換する
                const weatherJapanese = weathers[result];
                answer = `${timeWord}の${regionWord}の天気は${weatherJapanese}だわん。`;
                console.log( `返答：${answer}`)

            })

            resolve(answer);
        })
    );
}


questionAnswering('あさっての東京の');
