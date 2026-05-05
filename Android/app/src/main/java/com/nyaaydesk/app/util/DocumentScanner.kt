package com.nyaaydesk.app.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import com.google.mlkit.vision.documentscanner.GmsDocumentScanner
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * DocumentScanner — Wrapper for Google ML Kit Document Scanner API.
 * 
 * Provides a native scanning interface for Advocates to digitize 
 * physical legal documents directly into the app.
 * 
 * Features:
 * - Automatic edge detection and cropping.
 * - PDF generation and JPG export.
 * - Multi-page scanning support.
 */
@Singleton
class DocumentScanner @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val options = GmsDocumentScannerOptions.Builder()
        .setGalleryImportAllowed(true)
        .setPageLimit(20)
        .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_PDF, GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
        .build()

    private val scanner: GmsDocumentScanner = GmsDocumentScanning.getClient(options)

    /**
     * Launch the scanner UI. 
     * @param launcher The activity result launcher from the calling Fragment/Activity.
     */
    fun startScan(launcher: ActivityResultLauncher<Intent>) {
        scanner.getStartScanIntent(context as android.app.Activity)
            .addOnSuccessListener { intentSender ->
                launcher.launch(Intent(intentSender.toString()))
            }
    }

    /**
     * Process the scan result.
     */
    fun handleResult(result: GmsDocumentScanningResult?): List<Uri> {
        return result?.pages?.map { it.imageUri } ?: emptyList()
    }
}
