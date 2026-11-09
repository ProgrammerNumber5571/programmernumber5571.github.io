# Backrooms Android app (Capacitor)

The Android app is the website built with Vite and wrapped by Capacitor. `android/` is the Android
Studio project; `capacitor.config.json` (shared with iOS) holds the app ID and name.

## Try it on your own phone (no accounts, no Android Studio)

1. GitHub repo > **Actions > Android build > Run workflow** (branch `source-latest`).
2. When it finishes, open the run and download the **backrooms-debug-apk** artifact (a zip).
3. Copy the `.apk` to your phone, open it, and allow "install from unknown sources" when asked.

## Local build (optional)

Needs Android Studio (it bundles the JDK and SDK).

```bash
npm install
npm run android:sync   # builds the site and copies it into android/
npm run android:open   # opens Android Studio; press Run to launch on a phone or emulator
```

## Google Play (internal testing, the TestFlight equivalent)

1. Create a **Google Play Console** developer account (one-time $25).
2. Pick the final **application ID** in `capacitor.config.json` (`appId`, currently the placeholder
   `com.backrooms.store`) and in `android/app/build.gradle` (`namespace` and `applicationId`), then run
   `npm run android:sync`. It can't change once published.
3. Create a signing key once and keep it safe (losing it means you can't update the app):

   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias backrooms \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   Never commit the keystore. Encode it for GitHub: `base64 -w0 release.keystore`
   (PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore"))`).
4. Add GitHub secrets (**Settings > Secrets and variables > Actions**):
   `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
5. Run **Android build** again. It now also produces **backrooms-release-aab**.
6. In Play Console create the app, then **Testing > Internal testing > Create release**, upload the
   `.aab`, and add testers by email. They install from a link through the Play Store.

The build number (`versionCode`) is the workflow run number, so each upload is higher than the last.
New personal developer accounts must run a closed test with enough testers for some days before
publishing publicly; check Google's current rules.

## Notes

- Icons and splash are placeholders generated from `assets/` (replace the PNGs, then run
  `npx capacitor-assets generate --android`).
- Firebase Auth popup sign-in (Google) does not work inside the app's web view; email/password does.
- Re-run `npm run android:sync` after any change to the site before building locally.
