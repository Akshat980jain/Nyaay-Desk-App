package com.nyaaydesk.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import dagger.hilt.android.HiltAndroidApp
import net.sqlcipher.database.SQLiteDatabase
import javax.inject.Inject

/**
 * NyaayDesk Application class.
 * @HiltAndroidApp triggers Hilt's code generation, serving as the application-level
 * dependency container. All Hilt components (ViewModels, Repositories, etc.) are
 * initialized from this entry point.
 */
@HiltAndroidApp
class NyaayDeskApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        // Set crash handler as the absolute first action
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            val stackTrace = android.util.Log.getStackTraceString(throwable)
            // Save crash to preferences so we can show it on next launch if it's too early for UI now
            getSharedPreferences("nyaaydesk_crashes", android.content.Context.MODE_PRIVATE)
                .edit()
                .putString("last_crash", stackTrace)
                .commit()

            android.util.Log.e("NyaayDeskCRASH", "FATAL CRASH on thread ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        super.onCreate()

        // Explicitly load SQLCipher native libraries
        try {
            SQLiteDatabase.loadLibs(this)
        } catch (e: Throwable) {
            android.util.Log.e("NyaayDeskCRASH", "Failed to load SQLCipher libs", e)
        }
        
        // Firebase is auto-initialized via google-services.json
    }
}
