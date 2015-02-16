(function () {
    "use strict";
    var expect = require('chai').expect;

    describe("index.js", function () {
        describe("getWeather()", function(){
            var scraper = require("../index"),
                weather;
            it("should return a promise that resolves to an object", function(done){
                scraper.getWeather().then(function(res){
                    expect(res).to.be.an.object;
                    weather = res;
                    done();
                }).catch(function(err){
                    done(err);
                });
            });

            it("degrees_c should be defined and a number", function(done){
                expect(weather.degrees_c).to.exist;
                expect(weather.degrees_c).to.be.a.number;
                done();

                console.log(weather);
            });

            // TODO: Check all other fields.
        });
    });
}());
