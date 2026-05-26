package com.example.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {

    private lateinit var viewFinder: PreviewView
    private lateinit var permissionDeniedText: TextView
    private lateinit var cameraExecutor: ExecutorService

    private val requestMultiplePermissions =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
            val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false

            if (cameraGranted && audioGranted) {
                startCamera()
            } else {
                handlePermissionDenial()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)

        viewFinder = findViewById(R.id.viewFinder)
        permissionDeniedText = findViewById(R.id.permissionDeniedText)

        cameraExecutor = Executors.newSingleThreadExecutor()

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestMultiplePermissions.launch(REQUIRED_PERMISSIONS)
        }
    }

    private fun startCamera() {
        permissionDeniedText.visibility = View.GONE
        viewFinder.visibility = View.VISIBLE
        
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(viewFinder.surfaceProvider)
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview
                )
            } catch (exc: Exception) {
                Toast.makeText(this, "Camera initialization failed.", Toast.LENGTH_SHORT).show()
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun handlePermissionDenial() {
        Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
        viewFinder.visibility = View.GONE
        permissionDeniedText.visibility = View.VISIBLE
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        // unbindAll automatically happens by lifecycle 
    }

    companion object {
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    }
}
