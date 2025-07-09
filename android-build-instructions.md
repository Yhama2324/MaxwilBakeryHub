# Building MAXWIL Bakery APK

## Steps to build APK in Android Studio:

1. **Open Android Studio project** (MAXWIL Bakery)
2. **Update MainActivity.java** with production URL
3. **Go to Build menu** → Build Bundle(s) / APK(s) → Build APK(s)
4. **Wait for build to complete**
5. **Find APK at**: `app/build/outputs/apk/debug/app-debug.apk`

## For production deployment:
- Use permanent URL: Deploy web app to Vercel/Netlify first
- Sign the APK for Google Play Store distribution
- Test on real devices before distribution

## Alternative: Progressive Web App (PWA)
Convert your web app to PWA for easy mobile installation:
- Add service worker for offline functionality
- Add manifest.json for native app feel
- Users can "Add to Home Screen" from browser