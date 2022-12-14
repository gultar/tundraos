
const getCoordinates = () =>{
    //Gives a prompt, the api request doesn't 
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition((position) => {
            
            let lat = position.coords.latitude;
            let long = position.coords.longitude;
            
            resolve({ latitude:lat, longitude:long })
        });
    })
}

const getLocalCoordinates = async () =>{
   const result = await $.getJSON('https://ip-api.io/json/')
   if(!result) return false

   return result
}

const convertWeatherCode = (code) =>{

    const weatherCodes = {
        0:'Clear Sky',
        1:'Mainly clear',
        2:'Partly cloudy',
        3:'Overcast',
        45:'Fog',
        48:'Depositing rime fog',
        51:'Light drizzle',
        53:'Moderate drizzle',
        55:'Dense drizzle',
        56:'Light freezing drizzle',
        57:'Dense freezing drizzle',
        61:'Light rain',
        63:'Moderate rain',
        65:'Heavy rain',
        66:'Light freezing rain',
        67:'Heavy freezing rain',
        71:'Light snowfall',
        73:'Moderate snowfall',
        75:'Heavy snowfall',
        77:'Snow grains',
        80:'Light rain shower',
        81:'Moderate rain shower',
        82:'Violent rain shower',
        85:'Light snow shower',
        86:'Heavy snow shower',
        95:'Thunderstorm',
        96:'Thunderstorm with light hail',
        99:'Thunderstorm with heavy hail'
    }

    return weatherCodes[code]
}

const getCurrentWeather = async () =>{
    const { latitude, longitude, city, country_name } = await getLocalCoordinates()
    //// https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}
    const result = await $.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_hours`)
    const { daily, current_weather } = result
    const weatherStage = daily.weathercode.map(code => convertWeatherCode(code))
    console.log(city, country_name)
    return {
        ...current_weather,
        weather:weatherStage,
        city,
        country_name,
    }
}
