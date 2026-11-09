# Backrooms iOS app (Capacitor + TestFlight)

The iOS app is the website built with Vite and wrapped in a native shell by Capacitor.
`ios/` is the Xcode project; `capacitor.config.json` holds the app ID, name and webDir.

## Before the first upload

1. **Pick the final bundle ID** in `capacitor.config.json` (`appId`, currently `com.backrooms.store`).
   It must match the App ID you register in Apple Developer and can't change once the app exists in
   App Store Connect. Then run `npm run ios:sync`.
2. **Apple Developer Program** account ($99/year), then in App Store Connect create a new app with
   that bundle ID.
3. **Icon and splash** are placeholders generated from `assets/` (a vinyl record). Replace
   `assets/icon-only.png` (1024x1024, no transparency) and `assets/splash.png` (2732x2732), then run
   `npx capacitor-assets generate --ios`.

## Build and upload without a Mac (GitHub Actions)

`.github/workflows/ios-testflight.yml` builds on a GitHub-hosted Mac and uploads straight to
TestFlight. It only runs when you start it by hand.

One-time setup:

1. Enrol in the **Apple Developer Program** and note your **Team ID** (Membership details page).
2. In App Store Connect > **Apps > New App**, create the app with your final bundle ID
   (the same `appId` as in `capacitor.config.json`).
3. App Store Connect > **Users and Access > Integrations > App Store Connect API**: create a key with
   the **App Manager** role. Download the `.p8` file (only possible once) and note the **Key ID** and
   **Issuer ID**.
4. In the GitHub repo > **Settings > Secrets and variables > Actions**, add four secrets:

   | Secret | Value |
   | --- | --- |
   | `APPLE_TEAM_ID` | your Team ID |
   | `ASC_KEY_ID` | the API key's Key ID |
   | `ASC_ISSUER_ID` | the Issuer ID |
   | `ASC_KEY_P8` | the full contents of the `.p8` file, including the BEGIN/END lines |

To ship a build: **Actions > iOS TestFlight > Run workflow**. The build number is the run number, so
it always increases. After processing (10-30 min) it shows up in TestFlight.

Note: this is untested until the secrets exist; the first run may need a fix or two.

## Build and upload on a Mac (alternative)

```bash
npm install
npm run ios:sync     # builds the site and copies it into the iOS project
npm run ios:open     # opens Xcode
```

In Xcode: select the **App** target, **Signing & Capabilities**, choose your Team and tick
"Automatically manage signing". Set Version / Build. Choose **Any iOS Device (arm64)**, then
**Product > Archive > Distribute App > App Store Connect > Upload**.

Every upload needs a higher **Build** number than the last one.

## TestFlight

1. App Store Connect > your app > **TestFlight**; the build appears after processing (10-30 min).
2. **Internal testing**: add people from your App Store Connect team; no review.
3. **External testing**: create a group, add the build, add testers by email or public link.
   The first build of each version goes through a short Beta App Review.
4. Builds expire after 90 days.

## Notes

- Export compliance is pre-answered (`ITSAppUsesNonExemptEncryption` is false in `Info.plist`).
- Firebase Auth popup/redirect sign-in (for example Google) does not work inside the app's web view;
  email/password does. Add a native sign-in plugin if you need social login.
- Re-run `npm run ios:sync` after every change to the site, before archiving.
