# Postman Collection Generator

এই স্ক্রিপ্ট আপনার Node.js প্রজেক্টের জন্য স্বয়ংক্রিয়ভাবে Postman collection তৈরি করে।

## ব্যবহার

```bash
node scripts/generate-postman-collection.js <module-name>
```

### উদাহরণ:
```bash
node scripts/generate-postman-collection.js auth
node scripts/generate-postman-collection.js user
node scripts/generate-postman-collection.js task
```

## বৈশিষ্ট্য

### 🎯 স্মার্ট নামকরণ (Comment-based Naming)
এখন আপনি প্রতিটি endpoint এর উপরে comment যোগ করে custom নাম দিতে পারেন:

```javascript
// User Login
router.post('/login', AuthController.loginUser);

// Forget Password Request  
router.post('/forget-password', AuthController.forgetPassword);

// Email Verification
router.post('/verify-email', AuthController.verifyEmail);
```

স্ক্রিপ্ট এই comment গুলো পড়ে Postman collection এ সুন্দর নাম ব্যবহার করবে।

### 🔍 অন্যান্য বৈশিষ্ট্য
- **স্বয়ংক্রিয় মডিউল সনাক্তকরণ** - সব উপলব্ধ মডিউল খুঁজে বের করে
- **রুট পার্সিং** - সব API endpoint স্বয়ংক্রিয়ভাবে খুঁজে বের করে
- **Environment Variable সনাক্তকরণ** - config ফাইল থেকে সব variable খুঁজে বের করে
- **Authentication সেটআপ** - Bearer token স্বয়ংক্রিয়ভাবে যোগ করে
- **Sample Request Bodies** - POST/PUT/PATCH এর জন্য নমুনা data যোগ করে

## আউটপুট

Generated collections সংরক্ষিত হয় `postman-collections/` ফোল্ডারে:

```
postman-collections/
├── auth-collection.json
├── user-collection.json
├── task-collection.json
└── ...
```

## Postman এ Import করার নিয়ম

1. Postman খুলুন
2. **Import** বাটনে ক্লিক করুন
3. Generated JSON ফাইল select করুন
4. Environment variables setup করুন:
   - `BASE_URL`: আপনার API এর base URL (যেমন: `http://localhost:5000/api/v1`)
   - `AUTH_TOKEN`: Login করার পর পাওয়া JWT token

## উপলব্ধ মডিউল

- admin
- auth  
- banner
- bid
- bookmark
- category
- chat
- comments
- dispute
- faq
- homePageEdit
- message
- notification
- payment
- rating
- report
- rule
- task
- user

## Environment Variables

স্ক্রিপ্ট এই variables স্বয়ংক্রিয়ভাবে সনাক্ত করে:

### 🔧 System Variables:
- `BASE_URL` - API base URL (যেমন: `http://localhost:5000/api/v1`)
- `AUTH_TOKEN` - Authentication token
- `DATABASE_URL` - Database connection
- `JWT_SECRET` - JWT signing key
- আরো অনেক...

### 🧪 Test Data Variables:
- `TEST_EMAIL` - Test email address (`test@example.com`)
- `TEST_PASSWORD` - Test password (`password123`)
- `TEST_NAME` - Test user name (`John Doe`)
- `NEW_PASSWORD` - New password for change/reset (`newPassword123`)
- `OLD_PASSWORD` - Old password for change (`oldPassword123`)
- `RESET_TOKEN` - Password reset token (`sample_reset_token`)
- `VERIFY_TOKEN` - Email verification token (`sample_verify_token`)
- `USER_ROLE` - User role (`POSTER`)
- `UPDATED_NAME` - Updated name for profile (`Updated Name`)
- `USER_BIO` - User bio (`This is my bio`)
- `TASK_TITLE` - Task title (`Sample Task Title`)
- `TASK_DESCRIPTION` - Task description (`Sample task description`)
- `TASK_BUDGET` - Task budget (`100`)
- `TASK_DEADLINE` - Task deadline (`2024-12-31`)

এই variables গুলো collection এর সব request এ ব্যবহার করা যাবে। আপনি চাইলে এগুলোর value পরিবর্তন করে নিজের মতো করে test করতে পারবেন।

## Error Handling

- অবৈধ মডিউল নাম দিলে error message এবং উপলব্ধ মডিউলের তালিকা দেখায়
- Route ফাইল না পাওয়া গেলে alternative naming patterns চেক করে
- Environment variable detection fail হলে warning দেয় কিন্তু script বন্ধ হয় না

## কাস্টমাইজেশন

আপনি চাইলে script modify করে:
- নতুন sample request bodies যোগ করতে পারেন
- Environment variables এর default values পরিবর্তন করতে পারেন  
- Request headers customize করতে পারেন
- Authentication logic পরিবর্তন করতে পারেন