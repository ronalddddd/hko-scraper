Hong Kong Observatory and Air Quality Health Index data scraper
================================================================

Install
--------
`npm install hko-scraper`

Usage
------

        var scraper = require('hko-scraper');
        scraper.getWeather().then(function(weather){
            console.log(weather);
        });

Example output
--------------

        { scrape_date: Mon Feb 16 2015 22:41:17 GMT+0800 (HKT),
          degrees_c: 20,
          humidity_pct: 90,
          uv_index: 2,
          uv_intensity: 'low',
          weather_condition:
           { number: 77,
             caption: 'Mainly Fine',
             icon_url: 'http://rss.weather.gov.hk/img/pic77.png' },
          weather_warning:
           { date: Sat Feb 14 2015 21:47:00 GMT+0800 (HKT),
             text: 'There is no warning in force',
             icon_url: undefined },
          air_quality:
           { date: Mon Feb 16 2015 22:30:00 GMT+0800 (HKT),
             general: { from: 2, to: 7 },
             roadside: { from: 9, to: undefined } } }