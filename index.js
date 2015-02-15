(function () {
    'use strict';
    var bluebird = require('bluebird'),
        request = bluebird.promisify(require('request')),
        cheerio = require('cheerio'),
        format = require('util').format,
        currentWeatherFeedUrl = "http://rss.weather.gov.hk/rss/CurrentWeather.xml",
        currentWarningFeedUrl = "http://rss.weather.gov.hk/rss/WeatherWarningSummaryv2.xml",
        airQualityFeedUrl = "http://www.aqhi.gov.hk/epd/ddata/html/out/aqhirss_Eng.xml";

    /**
     * Loads the provided URL into cheerio.load() method
     * @param url the URL to request
     * @returns {*} A promise that resolve to the cheerio.load() result object
     * @private
     */
    var _getFeed = function (url) {
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
                "weather_type": undefined,
                "degrees_c": undefined,
                "humidity_pct": undefined,
                "uv_index": undefined,
                "uv_intensity": "",
                "weather_warning": {
                    "date": undefined,
                    "text": ""
                },
                "air_quality": {
                    date: undefined,
                    general: {
                        from: undefined,
                        to: undefined
                    },
                    roadSide: {
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
            aqDateRegex = /HKSAR Air Quality Health Index at : (.* \+0800)/, // HKSAR Air Quality Health Index at : Sun, 15 Feb 2015 16:30:00 +0800 Current Condition
            aqGeneralRegex = /General Stations: (\d*) to (\d*)/, // General Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)
            aqRoadRegex = /Roadside Stations: (\d*) to (\d*)/; // General Stations: 4 to 7 (Health Risk: Moderate to High)</p><p>Roadside Stations: 6 to 10 (Health Risk: Moderate to Very High)

        return bluebird.all([
            // Current Weather from HKO
            _getFeed(currentWeatherFeedUrl).then(function ($) {
                var weatherStr = $('description p').text(),
                    degreesMatch = degreesRegex.exec(weatherStr),
                    humidityMatch = humidityRegex.exec(weatherStr),
                    uvIndexMatch = uvIndexRegex.exec(weatherStr),
                    uvIntensityMatch = uvIntensityRegex.exec(weatherStr);

                //console.log(degreesMatch);
                weather.degrees_c = (degreesMatch && degreesMatch.length > 1)? parseInt(degreesMatch[1]) : null;
                weather.humidity_pct = (humidityMatch && humidityMatch.length > 1)? parseInt(humidityMatch[1]) : null;
                weather.uv_index = (uvIndexMatch && uvIndexMatch.length > 1)? parseFloat(uvIndexMatch[1]) : null;
                weather.uv_intensity = (uvIntensityMatch && uvIntensityMatch.length > 1)? uvIntensityMatch[1].trim() : null;
            }).catch(function(err){
                console.error("Error parsing Current Weather data!",err, err.stack.toString());
            }),
            // Current Warning from HKO
            _getFeed(currentWarningFeedUrl).then(function ($) {
                var warningMatch = warningRegex.exec($('item title').text());
                weather.weather_warning.text = (warningMatch && warningMatch.length > 1)? warningMatch[1].trim() : null;
                weather.weather_warning.date = (warningMatch && warningMatch.length >= 5)?
                    new Date(
                        warningMatch[6], // year
                        parseInt(warningMatch[5]) - 1, // month index
                        parseInt(warningMatch[4]), // day
                        parseInt(warningMatch[2]), // hour
                        parseInt(warningMatch[3])) // minute
                    : null;
            }).catch(function(err){
                console.error("Error parsing Weather Warning data!",err, err.stack.toString());
            }),
            // Air Pollution index from
            _getFeed(airQualityFeedUrl).then(function ($) {
                var aqDateMatch = aqDateRegex.exec($('item title').text()),
                    aqGeneralMatch = aqGeneralRegex.exec($('item description').text()),
                    aqRoadSideMatch = aqRoadRegex.exec($('item description').text());

                weather.air_quality.date = new Date(aqDateMatch[1]);
                weather.air_quality.general.from = parseInt(aqGeneralMatch[1]) || undefined;
                weather.air_quality.general.to = parseInt(aqGeneralMatch[2]) || undefined;
                weather.air_quality.roadSide.from = parseInt(aqRoadSideMatch[1]) || undefined;
                weather.air_quality.roadSide.to = parseInt(aqRoadSideMatch[2]) || undefined;
            }).catch(function(err){
                console.error("Error parsing Air Quality data!",err, err.stack.toString());
            })
        ]).then(function () {
            // All done.
            console.log(weather);
            return weather;
        }).catch(function (err) {
            throw err;
        });
    };

    module.exports.getWeather = getWeather;
}());

module.exports.getWeather();
