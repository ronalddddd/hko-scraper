(function () {
    'use strict';
    var bluebird = require('bluebird'),
        request = bluebird.promisify(require('request')),
        cheerio = require('cheerio'),
        format = require('util').format,
        currentWeatherFeedUrl = "http://rss.weather.gov.hk/rss/CurrentWeather.xml",
        currentWarningFeedUrl = "http://rss.weather.gov.hk/rss/WeatherWarningSummaryv2.xml",
        airQualityFeedUrl = "http://www.aqhi.gov.hk/epd/ddata/html/out/aqhirss_Eng.xml",
        weatherConditionsMap = { // Legend: http://www.weather.gov.hk/textonly/explain/wxicon_e.htm
            "50": { caption: "Sunny" },
            "51": { caption: "Sunny Periods" },
            "52": { caption: "Sunny Intervals" },
            "53": { caption: "Sunny Periods with A Few Showers" },
            "54": { caption: "Sunny Intervals with Showers" },
            "60": { caption: "Cloudy" },
            "61": { caption: "Overcast" },
            "62": { caption: "Light Rain" },
            "63": { caption: "Rain" },
            "64": { caption: "Heavy Rain" },
            "65": { caption: "Thunderstorms" },
            "70": { caption: "Fine" },
            "71": { caption: "Fine" },
            "72": { caption: "Fine" },
            "73": { caption: "Fine" },
            "74": { caption: "Fine" },
            "75": { caption: "Fine" },
            "76": { caption: "Mainly Cloudy" },
            "77": { caption: "Mainly Fine" },
            "80": { caption: "Windy" },
            "81": { caption: "Dry" },
            "82": { caption: "Humid" },
            "83": { caption: "Fog" },
            "84": { caption: "Mist" },
            "85": { caption: "Haze" },
            "90": { caption: "Hot" },
            "91": { caption: "Warm" },
            "92": { caption: "Cool" },
            "93": { caption: "Cold" }
        };

    /**
     * Loads the provided URL into cheerio.load() method
     * @param url the URL to request
     * @returns {*} A promise that resolve to the cheerio.load() result object
     * @private
     */
    var _getXmlFeed = function (url) {
        return request(url).then(function (res) {
            var response = res[0],
                body = res[1];

            if (response.statusCode !== 200) {
                throw new Error(format("[%s] %s", response.statusCode, response.request.href));
            }

            return cheerio.load(body.replace(/<!\[CDATA\[([^\]]+)]\]>/ig, "$1")); // Remove CDATA tags because cheerio can't handle them http://stackoverflow.com/a/15645279
        }).catch(function (err) {
            throw err;
        });
    };

    var getWeather = function () {
        var weather = {
                "scrape_date": new Date(),
                "degrees_c": undefined,
                "humidity_pct": undefined,
                "uv_index": undefined,
                "uv_intensity": undefined,
                "weather_condition": { // Legend: http://www.weather.gov.hk/textonly/explain/wxicon_e.htm
                    "number": undefined,
                    "caption": undefined,
                    "icon_url": undefined
                },
                "weather_warning": { // Legend: http://www.hko.gov.hk/textonly/v2/explain/intro.htm
                    "date": undefined,
                    "text": undefined,
                    "icon_url": undefined
                },
                "air_quality": {
                    date: undefined,
                    general: {
                        from: undefined,
                        to: undefined
                    },
                    roadside: {
                        from: undefined,
                        to: undefined
                    }
                }
            },
            degreesRegex = /: (\d*) degrees Celsius/,
            humidityRegex = /Relative Humidity : (\d*) per cent/,
            uvIndexRegex = /UV Index [^\d]*([^\r|\n]*)/,
            uvIntensityRegex = /Intensity of UV radiation : ([^\r|\n|$]*)/,
            warningRegex = /(.*) \((\d\d):(\d\d) HKT (\d\d)\/(\d\d)\/(\d\d\d\d)\)/,
            aqDateRegex = /HKSAR Air Quality Health Index at : (.* \+0800)/,// e.g. "HKSAR Air Quality Health Index at : Sun, 15 Feb 2015 16:30:00 +0800 Current Condition"
            aqGeneralRegex = /General Stations: (\d*)( to (\d*))?/, // "General Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)"
            aqRoadRegex = /Roadside Stations: (\d*)( to (\d*))?/, // "General Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)"
            conditionRegex = /[^\/]+(\d\d)\..*$/; // "http://www.weather.gov.hk/images/wxicon/pic77.png"

        return bluebird.all([
            // Current Weather from HKO
            _getXmlFeed(currentWeatherFeedUrl).then(function ($) {
                var weatherStr = $('description p').text(),
                    iconSrc = $('description img').first().attr("src"),
                    degreesMatch = degreesRegex.exec(weatherStr),
                    humidityMatch = humidityRegex.exec(weatherStr),
                    uvIndexMatch = uvIndexRegex.exec(weatherStr),
                    uvIntensityMatch = uvIntensityRegex.exec(weatherStr),
                    conditionMatch = conditionRegex.exec(iconSrc);

                //console.log(degreesMatch);
                weather.degrees_c = (degreesMatch && degreesMatch.length > 1)? parseInt(degreesMatch[1]) : null;
                weather.humidity_pct = (humidityMatch && humidityMatch.length > 1)? parseInt(humidityMatch[1]) : null;
                weather.uv_index = (uvIndexMatch && uvIndexMatch.length > 1)? parseFloat(uvIndexMatch[1]) : null;
                weather.uv_intensity = (uvIntensityMatch && uvIntensityMatch.length > 1)? uvIntensityMatch[1].trim() : null;
                if ((conditionMatch && conditionMatch.length > 1)){
                    weather.weather_condition.number = parseInt(conditionMatch[1]);
                    weather.weather_condition.caption = (weatherConditionsMap[conditionMatch[1]])? weatherConditionsMap[conditionMatch[1]].caption : null;
                    weather.weather_condition.icon_url = iconSrc || null;
                }
            }).catch(function(err){
                console.error("Error parsing Current Weather data!",err, err.stack.toString());
            }),
            // Current Warning from HKO
            _getXmlFeed(currentWarningFeedUrl).then(function ($) {
                var warningMatch = warningRegex.exec($('item title').text()),
                    iconSrc = $('description img').first().attr("src");
                weather.weather_warning.text = (warningMatch && warningMatch.length > 1)? warningMatch[1].trim() : null;
                weather.weather_warning.date = (warningMatch && warningMatch.length >= 5)?
                    new Date(
                        warningMatch[6], // year
                        parseInt(warningMatch[5]) - 1, // month index
                        parseInt(warningMatch[4]), // day
                        parseInt(warningMatch[2]), // hour
                        parseInt(warningMatch[3])) // minute
                    : null;
                weather.weather_warning.icon_url = iconSrc;
            }).catch(function(err){
                console.error("Error parsing Weather Warning data!",err, err.stack.toString());
            }),
            // Air Quality Health Index (AQHI) from the Environmental Protection Department (EPD)
            _getXmlFeed(airQualityFeedUrl).then(function ($) {
                var aqDateMatch = aqDateRegex.exec($('item title').text()),
                    aqGeneralMatch = aqGeneralRegex.exec($('item description').text()),
                    aqRoadSideMatch = aqRoadRegex.exec($('item description').text());

                weather.air_quality.date = new Date(aqDateMatch[1]);
                weather.air_quality.general.from = parseInt(aqGeneralMatch[1]) || undefined;
                weather.air_quality.general.to = parseInt(aqGeneralMatch[3]) || undefined;
                weather.air_quality.roadside.from = parseInt(aqRoadSideMatch[1]) || undefined;
                weather.air_quality.roadside.to = parseInt(aqRoadSideMatch[3]) || undefined;
            }).catch(function(err){
                console.error("Error parsing Air Quality data!",err, err.stack.toString());
            })
        ]).then(function () {
            // All done.
            //console.log(weather);
            return weather;
        }).catch(function (err) {
            throw err;
        });
    };

    module.exports.getWeather = getWeather;
}());
