package com.nyaaydesk.app.data.local

import androidx.room.TypeConverter
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/** Converts complex types (Lists, enums) for Room storage. */
class RoomTypeConverters {

    @TypeConverter
    fun fromStringList(value: List<String>?): String = Json.encodeToString(value ?: emptyList())

    @TypeConverter
    fun toStringList(value: String?): List<String> {
        return if (value.isNullOrBlank()) emptyList() else Json.decodeFromString(value)
    }
}
