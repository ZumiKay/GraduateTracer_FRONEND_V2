# Cookie Consent Implementation

This implementation provides a comprehensive GDPR-compliant cookie consent system for the Graduate Tracer application.

## Features

- 🍪 **GDPR Compliant**: Full compliance with GDPR requirements
- 🎨 **Customizable UI**: Modern, responsive design with Hero UI components
- 🔧 **Flexible Configuration**: Easy to customize and integrate
- 📊 **Analytics Integration**: Built-in hooks for analytics tracking
- 🎯 **Marketing Support**: Marketing cookie management with tracking
- 🌙 **Theme Support**: Dark/light mode compatible
- 💾 **Persistent Storage**: Consent preferences saved in localStorage
- 🔄 **Auto-cleanup**: Removes non-consented cookies automatically

## Components

### CookieConsent

Main cookie consent banner component that appears at the bottom of the page.

```tsx
import CookieConsent from "./component/Cookie/CookieConsent";

<CookieConsent
  position="bottom"
  companyName="Your Company"
  privacyPolicyUrl="/privacy-policy"
/>;
```

### CookieSettingsButton

Button component that allows users to manage their cookie preferences.

```tsx
import CookieSettingsButton from "./component/Cookie/CookieSettingsButton";

<CookieSettingsButton variant="bordered" size="sm">
  Cookie Settings
</CookieSettingsButton>;
```

### Footer

Footer component with built-in cookie settings link.

```tsx
import Footer from "./component/Cookie/Footer";

<Footer companyName="Your Company" contactEmail="support@yourcompany.com" />;
```

### PrivacyPolicy

Comprehensive privacy policy component.

```tsx
import PrivacyPolicy from "./component/Cookie/PrivacyPolicy";

<PrivacyPolicy
  companyName="Your Company"
  contactEmail="support@yourcompany.com"
  lastUpdated="2024-01-01"
/>;
```

## Hooks

### useCookieConsent

Main hook for managing cookie consent state.

```tsx
import { useCookieConsent } from "./hooks/useCookieConsent";

const {
  hasConsent,
  preferences,
  isAllowed,
  grantConsent,
  revokeConsent,
  updatePreferences,
} = useCookieConsent();

// Check if analytics cookies are allowed
if (isAllowed("analytics")) {
  // Track analytics event
}
```

### useAnalytics

Hook for analytics tracking with consent checking.

```tsx
import { useAnalytics } from "./hooks/useCookieConsent";

const { track, trackPageView, trackUserAction, isAnalyticsAllowed } =
  useAnalytics();

// Track page view
trackPageView("Dashboard");

// Track user action
trackUserAction("button_click", "save_form", "form_123");

// Custom event tracking
track("custom_event", {
  category: "engagement",
  value: 1,
});
```

### useMarketing

Hook for marketing tracking with consent checking.

```tsx
import { useMarketing } from "./hooks/useCookieConsent";

const { trackSignup, trackConversionEvent, isMarketingAllowed } =
  useMarketing();

// Track signup
trackSignup({
  source: "organic",
  campaign: "homepage",
});

// Track conversion
trackConversionEvent({
  event_type: "purchase",
  value: 99.99,
  currency: "USD",
});
```

### useUserPreferences

Hook for managing user preferences with functional cookies.

```tsx
import { useUserPreferences } from "./hooks/useCookieConsent";

const {
  setPreference,
  getPreference,
  setTheme,
  getTheme,
  setLanguage,
  getLanguage,
  isFunctionalAllowed,
} = useUserPreferences();

// Save user preference
setPreference("dashboard_layout", "grid");

// Get user preference
const layout = getPreference("dashboard_layout");

// Theme management
setTheme("dark");
const currentTheme = getTheme();
```

## Cookie Categories

### Necessary Cookies

- **Purpose**: Essential for website functionality and security
- **Can be disabled**: No
- **Examples**: Authentication tokens, session data, security tokens

### Functional Cookies

- **Purpose**: Enhance user experience and remember preferences
- **Can be disabled**: Yes
- **Examples**: Theme preferences, language settings, user interface preferences

### Analytics Cookies

- **Purpose**: Help understand how visitors interact with the website
- **Can be disabled**: Yes
- **Examples**: Google Analytics, page views, user behavior tracking

### Marketing Cookies

- **Purpose**: Track visitors across websites for targeted advertising
- **Can be disabled**: Yes
- **Examples**: Facebook Pixel, Google Ads, conversion tracking

## Cookie Management Utilities

### setCookieWithConsent

Set cookies with consent checking.

```tsx
import { setCookieWithConsent } from "./utils/cookieUtils";

setCookieWithConsent("user_pref", "value", "functional", {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  secure: true,
  sameSite: "strict",
});
```

### getCookieValue

Get cookie value.

```tsx
import { getCookieValue } from "./utils/cookieUtils";

const value = getCookieValue("user_pref");
```

### deleteCookie

Delete a cookie.

```tsx
import { deleteCookie } from "./utils/cookieUtils";

deleteCookie("user_pref");
```

## Integration Guide

### 1. Add to Redux Store

The cookie consent reducer is already added to the Redux store in `src/redux/store.tsx`.

### 2. Add Components to App

Add the cookie consent banner and footer to your main App component:

```tsx
import CookieConsent from "./component/Cookie/CookieConsent";
import Footer from "./component/Cookie/Footer";

function App() {
  return (
    <div>
      {/* Your app content */}
      <Footer />
      <CookieConsent />
    </div>
  );
}
```

### 3. Add Privacy Policy Route

Add a privacy policy route to your router:

```tsx
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

<Route path="/privacy-policy" element={<PrivacyPolicyPage />} />;
```

### 4. Use Hooks in Components

Use the provided hooks in your components to respect user consent:

```tsx
import { useAnalytics } from "./hooks/useCookieConsent";

function MyComponent() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView("My Page");
  }, []);

  return <div>My Component</div>;
}
```

## Customization

### Styling

The components use Hero UI and Tailwind CSS. You can customize the appearance by:

1. Modifying the `className` props
2. Overriding CSS classes
3. Using Hero UI theme customization

### Content

Customize the content by modifying:

- Company name
- Privacy policy URL
- Cookie descriptions
- Button text

### Position

The cookie banner supports different positions:

- `bottom` (default)
- `top`
- `bottom-left`
- `bottom-right`

## Best Practices

1. **Always check consent** before setting non-necessary cookies
2. **Use the provided hooks** for analytics and marketing tracking
3. **Respect user preferences** and provide easy access to cookie settings
4. **Test thoroughly** to ensure cookies are properly managed
5. **Keep privacy policy updated** with accurate information

## Testing

Use the `CookieConsentExample` component to test the implementation:

```tsx
import CookieConsentExample from "./component/Cookie/CookieConsentExample";

// Add to a test page to verify functionality
<CookieConsentExample />;
```

## Compliance Notes

This implementation provides:

- ✅ Clear consent before setting cookies
- ✅ Granular control over cookie categories
- ✅ Easy way to withdraw consent
- ✅ Transparent information about cookie usage
- ✅ Automatic cleanup of non-consented cookies
- ✅ Persistent consent preferences

Make sure to review and update the privacy policy content to match your specific use case and legal requirements.

## Support

For questions or issues with the cookie consent implementation, please refer to the component documentation or contact the development team.
