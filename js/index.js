/**
 * Created by Branden on 10/6/17.
 */

var google_apikey = "AIzaSyCSgPL7LJfCOdUCwX6Fe9V4Rryp21lmbLA";
var dark_sky_apikey = "dd4b496800a1f02c61e158cba12097b5";
var lat;
var long;
var icons = new Skycons({"color" : "black"});
var white_icons = new Skycons({"color" : "white"});
var month = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
var day_of_week = ["Sundary", "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday"];
google.charts.load('current', {'packages':['corechart']});

$(function() {
    // Set up the date picker
    $( "#datepicker" ).datepicker();
    $('[data-toggle="datepicker"]').datepicker();

    /**
     * Uses the User's IP address to grab their current location
     * based on the Google Geolocation API instead of the HTML5
     * geolocation method due to request prompt.
     */
    function use_geolocation() {
        var url = "https://www.googleapis.com/geolocation/v1/geolocate?key=";
        var url_request = url + google_apikey;

        return $.ajax({
            type: "POST",
            url: "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyCSgPL7LJfCOdUCwX6Fe9V4Rryp21lmbLA",
            data: {},
            success: function (data) {
                /* Get and store the user's longitude and latitude */
                var location = data["location"];
                lat = location["lat"];
                long = location["lng"];
            },
            error: function (xhr, textStatus, errorThrown) {
                alert("Google's geolocation failed to detect your location.");
            }
        });
    }

    /**
     * A method to update current weather after making sure that we receive
     * the location of the user and grab the data. Using .when to make certain
     * we have the lat and long before grabbing information.
     * The method will update the icons, weather information for current weather,
     * and also the weather information for the weekly information as well as
     * calling the google charts method.
     */
    $.when(use_geolocation()).done(function(response) {
        var dark_sky_request = "https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/" +
            dark_sky_apikey + "/" + lat + "," + long;
        $.ajax({
            format: "jsonp",
            datatype: "jsonp",
            url: dark_sky_request,
            success: function(forecast) {
               var current_forecast = forecast["currently"];
               /* Set up Icon */
               icons.add("icon", current_forecast["icon"]);

               /* Write in current weather information */
               $("#cur-temp").html(current_forecast["temperature"] + "°F");
               $("#cur-status").html(current_forecast["summary"]);
               $("#cur-precip").html((current_forecast["precipProbability"] * 100) + "% chance of rain");

               /* Draw weekly google chart */
               google.charts.setOnLoadCallback(setup_weekly_chart(forecast["daily"]));

            },
            error: function (xhr, textStatus, errorThrown) {
                alert("error: " + JSON.stringify(xhr));
            }
        });


        icons.play();
    });

    /**
     * Takes in the daily information to create three different
     * Google API charts based on temperature, rain, and wind.
     * @param json_data: The daily information of the weather
     */
    function setup_weekly_chart(json_data) {
        var weekly_data = json_data["data"];
        var weekly_weather = [["Date", "Temperature High", "Temperature Low"]];
        var weekly_rain = [["Date", "Chance of Precipitation",
            "Inches of Precipitation", "Max Inches of Precipitation"]];
        var weekly_wind =  [["Date", "Wind Speed", "Wind Gust"]];
        var index = 1;
        var data;
        var data_rain;
        var data_wind;
        var options;
        var options_rain;
        var options_wind;
        var chart;
        var chart_rain;
        var chart_wind;

        /* Setting up the weekly weather summary */
        white_icons.add("weekly-icon", json_data["icon"]);
        white_icons.play();
        $("#weekly-weather-status").html(json_data["summary"]);

        /* Create a two dimensional array for google charts */
        $.each(weekly_data, function(key, value) {
            var date = new Date(value["time"] * 1000);
            var updated_date = month[(date.getMonth())] + " " + date.getDate();
            weekly_weather.push([updated_date, value["temperatureHigh"], value["temperatureLow"]]);
            weekly_rain.push([updated_date, value["precipProbability"] * 100,
                value["precipIntensity"], value["precipIntensityMax"]]);
            weekly_wind.push([updated_date, value["windSpeed"], value["windGust"]]);
            index++;
        });

        /* Create the google chart information for temperature */
        data = google.visualization.arrayToDataTable(weekly_weather);
        options = {
            title: 'Week Temperature High and Low',
            hAxis: {title: 'Date',  titleTextStyle: {color: '#333'}},
            vAxis: {minValue: 0}
        };
        chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
        chart.draw(data, options);

        /* Create the google chart information for rain */
        data_rain = google.visualization.arrayToDataTable(weekly_rain);
        options_rain = {
            title: 'Week Precipitation',
            hAxis: {title: 'Date',  titleTextStyle: {color: '#333'}},
            vAxis: {minValue: 0}
        };
        chart_rain = new google.visualization.AreaChart(document.getElementById('chart_div_rain'));
        chart_rain.draw(data_rain, options_rain);

        /* Create the google chart information for wind */
        data_wind = google.visualization.arrayToDataTable(weekly_wind);
        options_wind = {
            title: 'Week Wind',
            hAxis: {title: 'Date',  titleTextStyle: {color: '#333'}},
            vAxis: {minValue: 0}
        };
        chart_wind = new google.visualization.AreaChart(document.getElementById('chart_div_wind'));
        chart_wind.draw(data_wind, options_wind);
    }
});

/**
 * Method is called when search past information is entered.
 * Validates the date and then uses the dark-sky api to get
 * previous weather information.
 * Uses this information to display it and also use the data
 * for the google charts api.
 */
function search_past() {
    var month;
    var day;
    var year;
    var date = $("#datepicker").val();
    var date_split = date.split("/");
    var epoch_time;
    var darksky_request;

    /* Get the date from the input field and validate it */
    if (date_split.length != 3) {
        $(".error-text").html("Incorrect date format. Expected MM/DD/YYYY Please try again.");
    }
    month = parseInt(date_split[0]);
    day = parseInt(date_split[1]);
    year = parseInt(date_split[2]);

    if (isNaN(month) || isNaN(day) || isNaN(year)) {
        $(".error-text").html("Incorrect date format. Please try again.");
    }

    if (month < 0 || month > 12 || day < 0 || day > 31 || year < 1950 || year > 2017) {
        $(".error-text").html("Incorrect date format. Please try again.");
    }

    epoch_time = new Date(year, month - 1, day).getTime() / 1000;
    darksky_request = "https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/" +
        dark_sky_apikey + "/" + lat + "," + long + "," + epoch_time + "?exclude=currently,minutely,daily";

    $.ajax({
        format: "jsonp",
        datatype: "jsonp",
        url: darksky_request,
        success: function (forecast) {
            /* Set up icon and weather information on left hand column */
            icons.add("prev-weather-icon", forecast["hourly"]["icon"]);
            $("#prev-weather-status").html(forecast["hourly"]["summary"]);

            /* Draw weekly google chart */
            google.charts.setOnLoadCallback(setup_prev_chart(forecast["hourly"]));
        },
        error: function (xhr, textStatus, errorThrown) {
            alert("error: " + JSON.stringify(xhr));
        }
    });
}

/**
 * Takes in the hourly information to create three different
 * Google API charts based on temperature, rain, and wind.
 * @param json_data: The daily information of the weather
 */
function setup_prev_chart(json_data) {
    var hourly_data = json_data["data"];
    var hourly_weather = [["Hour", "Temperature", "Feels Like Temperature"]];
    var hourly_rain = [["Hour", "Chance of Precipitation", "Inches of Precipitation"]];
    var hourly_wind =  [["Hour", "Wind Speed"]];
    var data;
    var data_rain;
    var data_wind;
    var options;
    var options_rain;
    var options_wind;
    var chart;
    var chart2a;
    var chart2b;
    var hours = 0;

    /* Create a two dimensional array for google charts */
    $.each(hourly_data, function(key, value) {
        hourly_weather.push([hours, value["temperature"], value["apparentTemperature"]]);
        hourly_rain.push([hours, value["precipProbability"] * 100, value["precipIntensity"]]);
        hourly_wind.push([hours, value["windSpeed"]]);
        hours++;
    });

    /* Create the google chart information for Temperature */
    data = google.visualization.arrayToDataTable(hourly_weather);
    options = {
        title: 'Hourly Temperature',
        hAxis: {title: 'Hour',  titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0}
    };
    chart = new google.visualization.AreaChart(document.getElementById('chart_div2'));
    chart.draw(data, options);

    /* Create the google chart information for Rain */
    data_rain = google.visualization.arrayToDataTable(hourly_rain);
    options_rain = {
        title: 'Hourly Precipitation',
        hAxis: {title: 'Hour',  titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0}
    };
    chart2a = new google.visualization.AreaChart(document.getElementById('chart_div2a'));
    chart2a.draw(data_rain, options_rain);

    /* Create the google chart information for Wind */
    data_wind = google.visualization.arrayToDataTable(hourly_wind);
    options_wind = {
        title: 'Hourly Wind',
        hAxis: {title: 'Hour',  titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0}
    };
    chart2b = new google.visualization.AreaChart(document.getElementById('chart_div2b'));
    chart2b.draw(data_wind, options_wind);
}
