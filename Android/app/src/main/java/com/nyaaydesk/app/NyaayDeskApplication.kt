package com.nyaaydesk.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * NyaayDesk Application class.
 * @HiltAndroidApp triggers Hilt's code generation, serving as the application-level
 * dependency container. All Hilt components (ViewModels, Repositories, etc.) are
 * initialized from this entry point.
 */
@HiltAndroidApp
class NyaayDeskApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Firebase is auto-initialized via google-services.json
        // Crashlytics will catch unhandled exceptions from this point on
    }
}
