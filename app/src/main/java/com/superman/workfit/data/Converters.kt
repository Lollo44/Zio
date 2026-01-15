package com.superman.workfit.data

import androidx.room.TypeConverter
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types

class Converters {
    private val moshi = Moshi.Builder().build()
    private val listType = Types.newParameterizedType(List::class.java, GpsPoint::class.java)
    private val adapter = moshi.adapter<List<GpsPoint>>(listType)

    @TypeConverter
    fun gpsPointsToJson(points: List<GpsPoint>?): String? {
        return points?.let { adapter.toJson(it) }
    }

    @TypeConverter
    fun jsonToGpsPoints(json: String?): List<GpsPoint> {
        return json?.let { adapter.fromJson(it) } ?: emptyList()
    }
}
