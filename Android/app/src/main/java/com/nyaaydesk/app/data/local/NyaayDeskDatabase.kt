package com.nyaaydesk.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.nyaaydesk.app.data.local.dao.CaseDao
import com.nyaaydesk.app.data.local.dao.HearingDao
import com.nyaaydesk.app.data.local.dao.UserDao
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.data.local.entity.HearingEntity
import com.nyaaydesk.app.data.local.entity.UserEntity

/**
 * NyaayDesk local SQLCipher-encrypted Room database.
 * Acts as the offline cache for Supabase data.
 * Version increment requires a Migration strategy (never destructive in production).
 */
@Database(
    entities = [
        CaseEntity::class,
        HearingEntity::class,
        UserEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(RoomTypeConverters::class)
abstract class NyaayDeskDatabase : RoomDatabase() {
    abstract fun caseDao(): CaseDao
    abstract fun hearingDao(): HearingDao
    abstract fun userDao(): UserDao
}
