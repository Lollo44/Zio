package com.superman.workfit.network

import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class WeatherRepository {
    private val api: WeatherApi = Retrofit.Builder()
        .baseUrl("https://api.open-meteo.com")
        .addConverterFactory(MoshiConverterFactory.create())
        .build()
        .create(WeatherApi::class.java)

    suspend fun loadTemperature(latitude: Double, longitude: Double): Double? {
        return api.getWeather(latitude, longitude).current?.temperature_2m
    }
}
