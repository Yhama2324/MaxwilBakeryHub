#!/bin/bash

# MAXWIL' Bakery Android APK Build Script
# This script builds the Android APK from your web app

echo "🏗️  Building MAXWIL' Bakery Android APK..."

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "In Replit, this should be automatic. Try restarting the environment."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the web app for mobile
echo "🌐 Building web app for mobile..."
npm run build:mobile

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "❌ Web build failed. dist/public directory not found."
    exit 1
fi

echo "✅ Web build successful"

# Sync with Capacitor Android
echo "🔄 Syncing with Android project..."
npx cap sync android

# Build Android APK
echo "📱 Building Android APK..."
npx cap build android

# Check if APK was created
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "🎉 SUCCESS! Android APK built successfully!"
    echo "📍 APK Location: $APK_PATH"
    echo ""
    echo "You can now:"
    echo "1. Download the APK file from: $APK_PATH"
    echo "2. Install it on your Android device"
    echo "3. Test your bakery app on mobile!"
else
    echo "❌ APK build failed. Check the logs above for errors."
    echo "Common issues:"
    echo "- Android SDK not properly configured"
    echo "- Java/Gradle issues"
    echo "- Missing dependencies"
fi

echo ""
echo "Build process completed."