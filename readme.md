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

        { scrape_date: Sun Feb 15 2015 17:15:59 GMT+0800 (HKT),
          weather_type: undefined,
          degrees_c: 19,
          humidity_pct: 92,
          uv_index: 0.4,
          uv_intensity: 'low',
          weather_warning:
           { date: Sat Feb 14 2015 21:47:00 GMT+0800 (HKT),
             text: 'There is no warning in force' },
          air_quality:
           { date: Sun Feb 15 2015 16:30:00 GMT+0800 (HKT),
             general: { from: 4, to: 7 },
             roadSide: { from: 6, to: 10 } } }
