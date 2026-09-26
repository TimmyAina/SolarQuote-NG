# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---- Capacitor ---------------------------------------------------------
# The plugin bridge discovers implementations reflectively, so R8 cannot see
# the references and would strip them. The release build turns on
# minifyEnabled + shrinkResources, so these keeps are load-bearing: without
# them the APK installs and then fails at runtime.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <fields>;
    @com.getcapacitor.annotation.CapacacitorPlugin <methods>;
}

# ---- Capacitor plugins in use -----------------------------------------
-keep class com.capacitorjs.plugins.** { *; }

# ---- WebView JavaScript bridges ---------------------------------------
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
  public *;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# ---- OkHttp (Capacitor's HTTP stack) ----------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-keepclassmembers class okhttp3.** { *; }

# ---- FileProvider ------------------------------------------------------
-keep class androidx.core.content.FileProvider { *; }
