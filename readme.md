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

        { scrape_date: Mon Feb 16 2015 11:05:44 GMT+0800 (HKT),
          weather_condition:
           { id: 802,
             name: 'Clouds',
             description: 'scattered clouds',
             icon: '03d' },
          degrees_c: 21,
          humidity_pct: 88,
          uv_index: 2,
          uv_intensity: 'low',
          weather_warning:
           { date: Sat Feb 14 2015 21:47:00 GMT+0800 (HKT),
             text: 'There is no warning in force' },
          air_quality:
           { date: Mon Feb 16 2015 10:30:00 GMT+0800 (HKT),
             general: { from: 2, to: 7 },
             roadside: { from: 8, to: 10 } } }
