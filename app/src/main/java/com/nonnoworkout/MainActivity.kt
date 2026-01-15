package com.nonnoworkout

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.nonnoworkout.ui.NonnoWorkoutApp
import com.nonnoworkout.ui.theme.NonnoWorkoutTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NonnoWorkoutTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    NonnoWorkoutApp()
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun AppPreview() {
    NonnoWorkoutTheme {
        NonnoWorkoutApp()
    }
}
