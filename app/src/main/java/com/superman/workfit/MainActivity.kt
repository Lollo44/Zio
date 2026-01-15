package com.superman.workfit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.superman.workfit.ui.SupermanWorkfitApp
import com.superman.workfit.ui.theme.SupermanWorkfitTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SupermanWorkfitTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    SupermanWorkfitApp()
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun AppPreview() {
    SupermanWorkfitTheme {
        SupermanWorkfitApp()
    }
}
