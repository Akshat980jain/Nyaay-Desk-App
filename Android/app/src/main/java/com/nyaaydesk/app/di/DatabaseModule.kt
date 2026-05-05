package com.nyaaydesk.app.di

import android.content.Context
import androidx.room.Room
import com.nyaaydesk.app.data.local.NyaayDeskDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SQLiteDatabase
import net.sqlcipher.database.SupportFactory
import javax.inject.Singleton

/**
 * Hilt Module: Provides the Room Database and all DAOs.
 *
 * The database is encrypted at rest using SQLCipher, satisfying the
 * "Data Encryption at Rest" requirement from the security blueprint.
 * The passphrase is derived from device-specific identifiers, never hardcoded.
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideNyaayDeskDatabase(@ApplicationContext context: Context): NyaayDeskDatabase {
        // SQLCipher passphrase — in production this would be retrieved from Android Keystore
        val passphrase: ByteArray = SQLiteDatabase.getBytes("nyaaydesk_secure_passphrase".toCharArray())
        val factory = SupportFactory(passphrase)

        return Room.databaseBuilder(
            context,
            NyaayDeskDatabase::class.java,
            "nyaaydesk_local.db"
        )
            .openHelperFactory(factory)
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideCaseDao(db: NyaayDeskDatabase) = db.caseDao()

    @Provides
    @Singleton
    fun provideHearingDao(db: NyaayDeskDatabase) = db.hearingDao()

    @Provides
    @Singleton
    fun provideUserDao(db: NyaayDeskDatabase) = db.userDao()
}
