# পুশ নোটিফিকেশন – অল-ইন-ওয়ান মাস্টার গাইড (বাংলা)

এই গাইডে Firebase Cloud Messaging (FCM) – Web, Android, iOS—A-to-Z কভার করা হয়েছে। APNs (iOS) অংশ FCM iOS SDK-এর মাধ্যমে ব্রিজ হয়।

---

## ১) ওভারভিউ
- FCM (Android/iOS/Web): এক প্ল্যাটফর্মে Web + Mobile পুশ নোটিফিকেশন; টপিক/সেগমেন্টেশন, উচ্চ রিলায়েবিলিটি, সার্ভার SDK (`firebase-admin`) সহজ ইন্টিগ্রেশন।

আমরা একীভূত সমাধান হিসেবে FCM ব্যবহার করব—একই ব্যাকএন্ড থেকে Web, Android, iOS-এ নোটিফিকেশন যাবে।

---

## ২) প্রি-রিকুইজিটস
- HTTPS সাইট (Web FCM-এর জন্য আবশ্যক; লোকালে `http://localhost` ব্যতিক্রম)।
- ব্রাউজার সাপোর্ট: আধুনিক Chrome/Firefox/Edge; Safari-তেও FCM Web সমর্থন কনফিগ অনুযায়ী।
- Firebase প্রজেক্ট – Project Settings → Cloud Messaging → Server key।
- iOS-এর জন্য APNs Key/Certificate (Firebase Console-এ আপলোড, FCM iOS-এর জন্য)।

### ENV উদাহরণ
```
# FCM (Server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# FCM (Web)
FIREBASE_WEB_PUSH_CERTIFICATE_PUBLIC_KEY=BPq...public_key_from_firebase_console

# Server
BASE_URL=https://api.example.com
PORT=5000
```

---

## ৩) Quickstart – Step-by-Step (Copy & Paste)

এই সেকশনে একদম হাতে-কলমে কোথায় কী কোড বসাতে হবে, কোন ভ্যালু কোথা থেকে নেবেন—সব কিছু স্টেপ-বাই-স্টেপ দেওয়া হলো।

### ৩.১ Firebase Console – কীভাবে কনফিগ নেবেন
- Console: https://console.firebase.google.com → নতুন Project অথবা বিদ্যমান প্রজেক্ট ওপেন করুন।
- Cloud Messaging সক্রিয় থাকছে কিনা নিশ্চিত করুন (Project Settings → Cloud Messaging)।
- Service accounts → `Generate new private key` ক্লিক করে JSON ডাউনলোড করুন। এতে `project_id`, `client_email`, `private_key` থাকবে।
- Web App যোগ করুন → যে `firebaseConfig` (apiKey, projectId, messagingSenderId, appId) দেখাবে তা কপি রাখুন।
- Cloud Messaging → Web Push certificates → `Public key` কপি করে `.env`-এ `FIREBASE_WEB_PUSH_CERTIFICATE_PUBLIC_KEY` হিসেবে রাখুন।
- iOS App যোগ করলে APNs key/cert এখানে আপলোড করুন; Android App যোগ করলে `google-services.json` ডাউনলোড করুন।

### ৩.২ Backend (Node/Express/TypeScript) – কোড রাখার জায়গা
- ফাইল তৈরি করুন: `src/app/modules/push/fcm.ts`
```ts
// src/app/modules/push/fcm.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
  }),
});

export const sendToToken = async (token: string, payload: { title: string; body: string; extra?: Record<string, string> }) => {
  return admin.messaging().send({
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.extra || {},
    android: { priority: 'high' },
    apns: { payload: { aps: { contentAvailable: true } } },
  });
};

export const sendToTopic = async (topic: string, payload: { title: string; body: string; extra?: Record<string, string> }) => {
  return admin.messaging().send({
    topic,
    notification: { title: payload.title, body: payload.body },
    data: payload.extra || {},
  });
};

export const subscribeTokensToTopic = async (tokens: string[], topic: string) => admin.messaging().subscribeToTopic(tokens, topic);
export const unsubscribeTokensFromTopic = async (tokens: string[], topic: string) => admin.messaging().unsubscribeFromTopic(tokens, topic);
```

- কন্ট্রোলার তৈরি করুন: `src/app/modules/push/push.controller.ts`
```ts
// src/app/modules/push/push.controller.ts
import { Request, Response } from 'express';
import { sendToToken, sendToTopic } from './fcm';

// TODO: আপনার DB অনুযায়ী ইমপ্লিমেন্ট করুন
async function saveUserPushToken(userId: string, platform: 'web'|'android'|'ios', token: string) { /* persist */ }
async function getUserTokens(userId: string): Promise<{ token: string }[]> { return []; }

export const subscribe = async (req: Request, res: Response) => {
  const { platform, token } = req.body;
  const userId = (req as any).user?.id; // আপনার অথ মিডলওয়্যার অনুযায়ী নিন
  await saveUserPushToken(userId, platform, token);
  res.json({ success: true });
};

export const send = async (req: Request, res: Response) => {
  const { userId, payload } = req.body; // payload: { title, body, extra? }
  const tokens = await getUserTokens(userId);
  const results = await Promise.allSettled(tokens.map((t) => sendToToken(t.token, payload)));
  res.json({ success: true, results });
};

export const broadcast = async (req: Request, res: Response) => {
  const { topic, payload } = req.body;
  const id = await sendToTopic(topic, payload);
  res.json({ success: true, id });
};
```

- রাউটস আপডেট করুন: `src/app/routes/index.ts`-এ নতুন রাউট গ্রুপ যোগ করুন
```ts
// src/app/routes/index.ts → push রাউট যোগের স্কেচ
import express from 'express';
import * as pushController from '../modules/push/push.controller';

const router = express.Router();

// অথ মিডলওয়্যার ব্যবহার করুন (উদাহরণ): router.use(authMiddleware)
router.post('/api/v1/push/subscribe', pushController.subscribe);
router.post('/api/v1/push/send', pushController.send);
router.post('/api/v1/push/broadcast', pushController.broadcast);

export default router;
```

- DB মডেল সাজেশন (আপনার ORM অনুযায়ী):
```ts
// UserPushTokens: userId ↔ platform ↔ token
type Platform = 'web'|'android'|'ios';
interface UserPushToken { id: string; userId: string; platform: Platform; token: string; updatedAt: Date }
```

### ৩.৩ Web (Browser) – ফাইল কোথায় রাখবেন
- Service Worker ফাইল: `public/firebase-messaging-sw.js`
```js
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<AUTH_DOMAIN>',
  projectId: '<PROJECT_ID>',
  messagingSenderId: '<SENDER_ID>',
  appId: '<APP_ID>',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title || 'New message';
  const options = {
    body: payload.notification?.body,
    data: payload.data || {},
    icon: '/icons/notification.png',
    badge: '/icons/badge.png',
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

- অ্যাপ ইনিশিয়ালাইজেশনে (যেমন `index.html` বা আপনার SPA entry) এই স্ক্রিপ্ট দিন:
```html
<!-- index.html → Web FCM init + subscribe -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
  import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

  const firebaseConfig = {
    apiKey: '<API_KEY>',
    authDomain: '<AUTH_DOMAIN>',
    projectId: '<PROJECT_ID>',
    messagingSenderId: '<SENDER_ID>',
    appId: '<APP_ID>',
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications blocked');

  const vapidKey = '<FIREBASE_WEB_PUSH_CERTIFICATE_PUBLIC_KEY>'; // .env থেকে নিন
  const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });

  await fetch('/api/v1/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${window.authToken}` },
    body: JSON.stringify({ platform: 'web', token: fcmToken })
  });

  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    // TODO: ইন-অ্যাপ UI দেখান (টোস্ট/ব্যানার)
  });
</script>
```

### ৩.৪ Android – কোথায় কী বসাবেন
- Gradle ডিপেন্ডেন্সি:
```gradle
// app/build.gradle
implementation "com.google.firebase:firebase-messaging:23.1.2"
```

- Manifest-এ সার্ভিস ডিক্লেয়ার:
```xml
<!-- app/src/main/AndroidManifest.xml -->
<application>
  <service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
      <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
  </service>
</application>
```

- সার্ভিস ফাইল: `app/src/main/java/.../MyFirebaseMessagingService.kt`
```kotlin
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService: FirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // TODO: NotificationCompat দিয়ে নোটিফিকেশন দেখান
  }
  override fun onNewToken(token: String) {
    // TODO: backend subscribe API-তে পাঠান
  }
}
```

- টোকেন নিতে ও ব্যাকএন্ডে পাঠাতে:
```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
  if (!task.isSuccessful) return@addOnCompleteListener
  val token = task.result
  // TODO: /api/v1/push/subscribe-এ পাঠান (platform: 'android')
}
```

### ৩.৫ iOS – কোথায় কী বসাবেন
- Podfile:
```ruby
pod 'Firebase/Messaging'
```

- AppDelegate সেটআপ:
```swift
import Firebase
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in }
    application.registerForRemoteNotifications()
    Messaging.messaging().delegate = self
    return true
  }

  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    // TODO: backend subscribe API-তে পাঠান (platform: 'ios')
  }
}
```

### ৩.৬ API টেস্ট – দ্রুত যাচাই
- টোকেন সাবস্ক্রাইব (Web/Android/iOS থেকে টোকেন সংগ্রহের পর):
```bash
curl -X POST http://localhost:5000/api/v1/push/subscribe \
  -H "Content-Type: application/json" -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -d '{"platform":"web","token":"<FCM_TOKEN>"}'
```

- এক ইউজারকে পাঠানো:
```bash
curl -X POST http://localhost:5000/api/v1/push/send \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -d '{"userId":"<USER_ID>","payload":{"title":"Hello","body":"From server","extra":{"url":"/inbox"}}}'
```

- টপিকে ব্রডকাস্ট:
```bash
curl -X POST http://localhost:5000/api/v1/push/broadcast \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -d '{"topic":"news","payload":{"title":"Breaking","body":"New update"}}'
```

### ৩.৭ প্রোডাকশন চেকলিস্ট
- `.env` সিক্রেট সুরক্ষিতভাবে ম্যানেজ করুন (CI/CD secrets, Vault)।
- টোকেন রিফ্রেশ হ্যান্ডলার সক্রিয় রাখুন (Android `onNewToken`, iOS Messaging delegate, Web `getToken` রি-ট্রাই)।
- Rate limit + audit logging: সেন্ড API স্প্যাম-প্রুফ করুন।
- Android Notification Channel (8+) নিশ্চিত করুন; iOS APNs কনফিগ যাচাই।
- HTTPS বাধ্যতামূলক (localhost ব্যতিক্রম)।

---

## ৪) Firebase Cloud Messaging (FCM)

### ৪.১ সার্ভার সেটআপ
```ts
// fcm.ts
import admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const sendFcmToToken = async (token: string, data: any) => {
  const message: admin.messaging.Message = {
    token,
    notification: { title: data.title, body: data.body },
    data: data.extra || {}, // key-value pairs
    android: { priority: 'high' },
    apns: { payload: { aps: { contentAvailable: true } } },
  };
  return admin.messaging().send(message);
};

export const sendFcmToTopic = async (topic: string, data: any) => {
  const message: admin.messaging.Message = {
    topic,
    notification: { title: data.title, body: data.body },
    data: data.extra || {},
  };
  return admin.messaging().send(message);
};
```

### ৪.২ Android (ক্লায়েন্ট)
- Firebase SDK যোগ করুন; `FirebaseMessaging.getInstance().getToken()` থেকে FCM token নিন।
- টোকেন ব্যাকএন্ডে পাঠিয়ে ইউজারের সাথে ম্যাপ করুন।
- Notification Channel (Android 8+) কনফিগ করুন।

### ৪.৩ iOS (APNs/FCM)
- Apple Developer-এ APNs key/cert জেনারেট করে Firebase Console-এ আপলোড।
- iOS অ্যাপে Push permission নিন; FCM SDK দিয়ে device token রেজিস্টার।
- ব্যাকগ্রাউন্ড/ফোরগ্রাউন্ড হ্যান্ডলার ইমপ্লিমেন্ট করুন।

### ৪.৪ FCM – A-to-Z Full Process (Backend + Frontend)

এই সাবসেকশনে Web + Android + iOS—তিন প্ল্যাটফর্মে FCM ইন্টিগ্রেশন করার সম্পূর্ণ ধাপ (A থেকে Z) দেওয়া হয়েছে, কোড উদাহরণসহ।

#### ৪.৪.১ Firebase Console সেটআপ
- নতুন Project তৈরি করুন → Cloud Messaging সক্ষম আছে নিশ্চিত করুন।
- Project Settings → Service accounts → `Generate new private key` (JSON ডাউনলোড)।
- Web App যোগ করুন → `firebaseConfig` (apiKey ইত্যাদি) কপি রাখুন।
- Android App যোগ করুন → Package name দিন, `google-services.json` ডাউনলোড।
- iOS App যোগ করুন → Bundle ID দিন, APNs key/cert Firebase Console-এ আপলোড করুন, `GoogleService-Info.plist` ডাউনলোড।

#### ৪.৪.২ Backend (Node/TypeScript) – Admin SDK + API
- ENV-এ Service Account ক্রেডেনশিয়াল সেট করুন: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`।
- `firebase-admin` ইনিশিয়ালাইজ করে টোকেন/টপিক ভিত্তিক সেন্ডিং করুন।
- API রাউট: subscribe/unsubscribe/send/status—সব OAuth/Bearer প্রটেক্টেড।

উদাহরণ কোড:
```ts
// src/app/modules/push/fcm.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const sendToToken = async (token: string, payload: { title: string; body: string; extra?: Record<string, string> }) => {
  return admin.messaging().send({
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.extra || {},
    android: { priority: 'high' },
    apns: { payload: { aps: { contentAvailable: true } } },
  });
};

export const sendToTopic = async (topic: string, payload: { title: string; body: string; extra?: Record<string, string> }) => {
  return admin.messaging().send({
    topic,
    notification: { title: payload.title, body: payload.body },
    data: payload.extra || {},
  });
};

export const subscribeTokensToTopic = async (tokens: string[], topic: string) => admin.messaging().subscribeToTopic(tokens, topic);
export const unsubscribeTokensFromTopic = async (tokens: string[], topic: string) => admin.messaging().unsubscribeFromTopic(tokens, topic);
```

API কন্ট্রোলার (স্কেচ):
```ts
// src/app/modules/push/push.controller.ts
import { Request, Response } from 'express';
import { sendToToken, sendToTopic, subscribeTokensToTopic } from './fcm';

export const subscribe = async (req: Request, res: Response) => {
  const { platform, token } = req.body; // platform: 'web'|'android'|'ios'
  const userId = req.user.id;
  await saveUserPushToken(userId, platform, token); // DB persist
  res.json({ success: true });
};

export const send = async (req: Request, res: Response) => {
  const { userId, payload } = req.body; // payload: { title, body, extra }
  const tokens = await getUserTokens(userId);
  const results = await Promise.allSettled(tokens.map((t) => sendToToken(t.token, payload)));
  res.json({ success: true, results });
};

export const broadcast = async (req: Request, res: Response) => {
  const { topic, payload } = req.body;
  const id = await sendToTopic(topic, payload);
  res.json({ success: true, id });
};
```

DB মডেল সাজেশন:
```
UserPushTokens(
  id, userId, platform('web'|'android'|'ios'), token, updatedAt
)
```

#### ৪.৪.৩ Web (Frontend) – FCM Web SDK + Service Worker
- Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → `Public VAPID key` নিন।
- Web অ্যাপে Firebase SDK কনফিগ করুন; Service Worker `firebase-messaging-sw.js` রেজিস্টার করুন।
- `getToken()` দিয়ে FCM token নিন; ব্যাকএন্ডে পাঠান (subscribe API)।
- ফোরগ্রাউন্ডে `onMessage` ব্যবহার করে ইন-অ্যাপ আলার্ট দেখান; ব্যাকগ্রাউন্ডে SW নোটিফিকেশন দেখায়।

Initialization উদাহরণ:
```html
<!-- index.html -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
  import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

  const firebaseConfig = {
    apiKey: '<API_KEY>',
    authDomain: '<AUTH_DOMAIN>',
    projectId: '<PROJECT_ID>',
    messagingSenderId: '<SENDER_ID>',
    appId: '<APP_ID>',
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Service Worker রেজিস্টার
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  // Permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications blocked');

  // Web Push VAPID public key
  const vapidKey = '<FIREBASE_WEB_PUSH_CERTIFICATE_PUBLIC_KEY>';
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });

  // Backend-এ subscribe
  await fetch('/api/v1/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFromAuth}` },
    body: JSON.stringify({ platform: 'web', token })
  });

  // Foreground message
  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    // ইন-অ্যাপ টোস্ট/ব্যানার দেখান
  });
</script>
```

Service Worker:
```js
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<AUTH_DOMAIN>',
  projectId: '<PROJECT_ID>',
  messagingSenderId: '<SENDER_ID>',
  appId: '<APP_ID>',
});

const messaging = firebase.messaging();

// Background messages → Notification দেখায়
messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title || 'New message';
  const options = {
    body: payload.notification?.body,
    data: payload.data || {},
    icon: '/icons/notification.png',
    badge: '/icons/badge.png',
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

#### ৪.৪.৪ Android – FCM SDK
- Gradle: `implementation "com.google.firebase:firebase-messaging:23.1.2"` + Google Services plugin।
- `FirebaseMessaging.getInstance().token.addOnCompleteListener { ... }` দিয়ে টোকেন নিন; ব্যাকএন্ডে পাঠান।
- Notification Channel (Android 8+) তৈরি করুন।
- Foreground/Background হ্যান্ডলার ইমপ্লিমেন্ট করুন।

Kotlin উদাহরণ:
```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
  if (!task.isSuccessful) return@addOnCompleteListener
  val token = task.result
  // backend subscribe
}

class MyFirebaseMessagingService: FirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // show notification via NotificationCompat
  }
  override fun onNewToken(token: String) {
    // send to backend
  }
}
```

#### ৪.৪.৫ iOS – FCM + APNs
- CocoaPods: `pod 'Firebase/Messaging'`
- App capabilities: Push Notifications, Background Modes → Remote notifications।
- AppDelegate-এ permission/registration, FCM token ফেচ, হ্যান্ডলার।

Swift উদাহরণ:
```swift
import Firebase
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in }
    application.registerForRemoteNotifications()
    Messaging.messaging().delegate = self
    return true
  }

  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    // send token to backend
  }
}
```

#### ৪.৪.৬ Payload ডিজাইন
- `notification { title, body }` + `data { url, type, id }`—ডীপ লিঙ্ক/অ্যাকশন সিগনাল।
- Web-এ `onMessage` ইন-অ্যাপ UI, SW-এ Background নোটিফিকেশন।
- Android/iOS-এ লোকাল নোটিফিকেশন বিল্ড করুন (channel/sound ইত্যাদি)।

#### ৪.৪.৭ টপিক ম্যানেজমেন্ট
- সার্ভার-সাইড: `subscribeToTopic(tokens, topic)`/`unsubscribeFromTopic(tokens, topic)`।
- ইউজার সেগমেন্টেশন: role, city, interest—টপিক নাম দিয়ে গ্রুপিং।

#### ৪.৪.৮ টেস্টিং (End-to-End)
- Firebase Console → Cloud Messaging → Send test message (token/topic)।
- Web: DevTools Console-এ `onMessage` লগ দেখুন; SW নোটিফিকেশন ট্রিগার যাচাই।
- Android/iOS: এমুলেটর/রিয়াল ডিভাইসে টেস্ট, ফোরগ্রাউন্ড/ব্যাকগ্রাউন্ড আচরণ চেক।

#### ৪.৪.৯ প্রোডাকশন নোটস
- টোকেন রিফ্রেশ—নিয়মিত backend আপডেট করুন (`onNewToken`, iOS Messaging delegate)।
- Quiet hours/Rate limit—স্প্যাম এড়ান; পেলোড মিনিমাইজেশন।
- iOS APNs কনফিগ ঠিক রাখুন; Android Notification Channel বাধ্যতামূলক (8+)।

---

## ৫) টোকেন/সাবস্ক্রিপশন ম্যানেজমেন্ট
- ডিভাইস/ব্রাউজার প্রতি আলাদা টোকেন/সাবস্ক্রিপশন—এক ইউজারের একাধিক থাকতে পারে।
- রিফ্রেশ: FCM token রিফ্রেশ/ইনভ্যালিড হতে পারে—নিয়মিত আপডেট/ভ্যালিডেশন করুন।
- আনসাবস্ক্রাইব: ইউজার Toggle দিলে DB থেকে সাবস্ক্রিপশন/টোকেন ডিলিট করুন।
- ম্যাপিং: `userId ↔ tokens` টেবিল রাখুন; সেগমেন্টেশন/টপিক ফিচার সহজ হয়।

---

## ৬) ব্যাকএন্ড API ডিজাইন (উদাহরণ)
- `POST /api/v1/push/subscribe` → FCM token সংরক্ষণ।
- `POST /api/v1/push/send` → এক বা একাধিক ইউজার/টপিকে নোটিফিকেশন পাঠানো।
- `GET /api/v1/push/status` → ইউজারের সাবস্ক্রিপশন স্ট্যাটাস।
- অথেন্টিকেশন: Bearer টোকেন বাধ্যতামূলক; রোল/পারমিশন অনুযায়ী সেন্ড API সীমাবদ্ধ করুন।

Payload উদাহরণ:
```json
{
  "title": "Bid accepted",
  "body": "Your bid was accepted",
  "clickData": { "url": "/bids/123" }
}
```

---

## ৭) সিকিউরিটি ও প্রাইভেসি
- নোটিফিকেশন সেন্ড API প্রটেক্ট করুন (অ্যাডমিন/সিস্টেম-অথ) – পাবলিক রাখবেন না।
- রেট লিমিটিং: ইউজার/টপিক-ভিত্তিক থ্রোটলিং; স্প্যাম রোধ।
- ডাটা মিনিমাইজেশন: payload-এ সংবেদনশীল তথ্য পাঠাবেন না; শুধুই UI সিগনাল/ID।
- GDPR/প্রাইভেসি: Opt-in/Opt-out সম্মান করুন; পারসিস্টেড টোকেন/সাবস্ক্রিপশন ডিলিটের অপশন দিন।

---

## ৮) UX বেস্ট প্র্যাকটিস
- অনুমতি কেবল তখন চাইবেন যখন ইউজার কনটেক্সট বুঝে (-ক্লিকের পর)।
- Quiet hours: রাতের বেলায় নোটিফিকেশন কমান; লোকাল টাইমজোন।
- একশন বাটন: `actions` যোগ করুন—`open`, `dismiss`, বা `accept/reject` ইত্যাদি।
- লোকালাইজেশন: ইউজারের ভাষায় টেক্সট।
- ডীপ লিঙ্ক: `clickData.url` দিয়ে অ্যাপের ভিতরে নির্দিষ্ট পেজে নিন।

---

## ৯) টেস্টিং
- Web: DevTools → Service Worker রেজিস্ট্রেশন/Console `onMessage` লগ চেক; Firebase Console থেকে টেস্ট মেসেজ পাঠিয়ে দেখুন।
- Mobile (Android/iOS): এমুলেটর/রিয়াল ডিভাইসে ফোরগ্রাউন্ড/ব্যাকগ্রাউন্ড আচরণ চেক।
- লোকাল HTTPS: mkcert/openssl দিয়ে লোকাল সার্টিফিকেট; বা `localhost` ব্যতিক্রম।

---

## ১০) ট্রাবলশুটিং
- Permission denied: ইউজার ব্লক করেছে; UI-তে অপশন দিন।
- FCM token expired: রিফ্রেশ হ্যান্ডলার লাগান; নতুন টোকেন DB-তে আপডেট।
- APNs error: সার্ট/কি সমস্যা; Firebase Console-এ কনফিগ যাচাই।
- HTTPS mandatory; অনেক ব্রাউজারে HTTP-তে Web FCM কাজ করবে না (localhost ব্যতিক্রম)।

---

## ১১) আর্কিটেকচার (ASCII)
```
Web (Browser) ──(Permission)──► Service Worker ──(FCM getToken)──► Backend (save token)
   ▲                                                       │
   │                                                       └─► firebase-admin send (token/topic)
   │                                                                              │
   └──(Click)◄── Notification ◄───────────────◄────────────FCM (Web Background/Foreground)◄────┘

Mobile (Android/iOS) ──(FCM SDK Token)──► Backend (save token)
   ▲                                  │
   │                                  └─► firebase-admin send (token/topic)
   └──(Tap)◄── Notification ◄─────────◄───────────────
```

---

## ১২) ইন্টিগ্রেশন টিপস (এই প্রোজেক্টে)
- `src/app/routes/index.ts`-এ নতুন রাউট গ্রুপ `push` যোগ করুন।
- কন্ট্রোলার: `subscribe`, `sendToUser`, `sendToTopic`—প্রটেক্টেড।
- মডেল: `UserPushTokens` টেবিল/কলেকশন—`userId`, `platform`, `token`, `updatedAt`।
- লগিং: সেন্ড ফলাফল `fulfilled/rejected`—invalid হলে সঙ্গে সঙ্গে ক্লিনআপ।

---

## ১৩) রেফারেন্স লাইব্রেরি
- Firebase Admin: `firebase-admin`
- Client (Web): `@firebase/messaging`

---

এই গাইডের লক্ষ্য: একীভূতভাবে FCM ব্যবহার করে Web + Android + iOS—সব প্ল্যাটফর্মে পুশ নোটিফিকেশন ইমপ্লিমেন্টেশন সহজ করা। টোকেন/টপিক ম্যানেজমেন্ট ঠিক রাখুন এবং সেন্ড API প্রটেক্ট করুন।