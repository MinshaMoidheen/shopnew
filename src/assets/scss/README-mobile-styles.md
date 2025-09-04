# Mobile Responsive Styles

This directory contains shared mobile responsive styles that can be used across all components in the application.

## Files

- `mobile-responsive.scss` - Main mobile styles file containing all responsive CSS rules
- `../utility/mobileStyles.js` - JavaScript utility functions for mobile detection and styling

## Usage

### 1. Import the Styles

Add this import to any component that needs mobile responsiveness:

```javascript
import '@src/assets/scss/mobile-responsive.scss'
```

### 2. Use the Utility Functions

```javascript
import { 
  isMobileView, 
  getCurrentTheme, 
  getMobileContainerStyles,
  MOBILE_CLASSES,
  MOBILE_PATTERNS 
} from '@src/utility/mobileStyles'

// In your component
const [isMobile, setIsMobile] = useState(isMobileView())
const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())
```

### 3. Apply Mobile Classes

Use the predefined mobile classes:

```jsx
<Card className={isMobile ? MOBILE_CLASSES.card : ''}>
  <CardHeader className={isMobile ? MOBILE_CLASSES.cardHeader : ''}>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody className={isMobile ? MOBILE_CLASSES.cardBody : ''}>
    Content
  </CardBody>
</Card>
```

### 4. Use Mobile Patterns

```jsx
// Two column layout
<Col lg='3' sm='6' xs={MOBILE_PATTERNS.twoColumn(isMobile)}>

// Flex direction
<div className={`d-flex ${MOBILE_PATTERNS.flexDirection(isMobile)}`}>

// Font size
<h3 style={{ fontSize: MOBILE_PATTERNS.fontSize(isMobile, '24px') }}>
```

## Available Mobile Classes

### Container Classes
- `.mobile-container` - Main mobile container
- `.mobile-card` - Mobile card styling
- `.mobile-card-header` - Mobile card header
- `.mobile-card-body` - Mobile card body

### Content Classes
- `.mobile-stats-card` - Statistics cards
- `.mobile-stats-title` - Statistics titles
- `.mobile-stats-value` - Statistics values
- `.mobile-table` - Mobile table styling
- `.mobile-table-container` - Table container with scroll

### Form Classes
- `.mobile-form-section` - Form sections
- `.mobile-form-input` - Form inputs
- `.mobile-search-section` - Search sections
- `.mobile-search-input` - Search inputs

### Button Classes
- `.mobile-button` - General mobile buttons
- `.mobile-button-container` - Button containers
- `.mobile-add-button` - Add buttons
- `.mobile-action-buttons` - Action button groups
- `.mobile-action-btn` - Individual action buttons

### Layout Classes
- `.mobile-amount-cards` - Amount display cards
- `.mobile-amount-card` - Individual amount cards
- `.mobile-filter-buttons` - Filter button groups
- `.mobile-filter-btn` - Individual filter buttons

### Item Classes
- `.mobile-item-card` - Item cards
- `.mobile-remove-container` - Remove button containers
- `.mobile-remove-btn` - Remove buttons

### DataGrid Classes
- `.mobile-datagrid` - Mobile DataGrid styling

## Theme Support

The styles automatically support both light and dark themes:

```scss
[data-theme="dark"] .mobile-card,
.dark .mobile-card {
  background-color: #181c2e !important;
  border: 1px solid #2d3748 !important;
  color: #ffffff !important;
}
```

## Responsive Breakpoints

- **Mobile**: `max-width: 767.98px`
- **Desktop**: `min-width: 768px`

## Best Practices

1. **Always use the utility functions** instead of hardcoding mobile detection
2. **Apply mobile classes conditionally** based on `isMobile` state
3. **Use mobile patterns** for common responsive behaviors
4. **Test on actual mobile devices** to ensure proper display
5. **Keep mobile styles in the external file** - don't inline them in components

## Example Implementation

```jsx
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardBody, Row, Col } from 'reactstrap'
import '@src/assets/scss/mobile-responsive.scss'
import { 
  isMobileView, 
  getCurrentTheme, 
  getCardStyles,
  MOBILE_CLASSES 
} from '@src/utility/mobileStyles'

const MyComponent = () => {
  const [isMobile, setIsMobile] = useState(isMobileView())
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileView())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={isMobile ? MOBILE_CLASSES.container : ''}>
      <Card 
        className={isMobile ? MOBILE_CLASSES.card : ''} 
        style={getCardStyles(isMobile, currentTheme === 'dark')}
      >
        <CardHeader className={isMobile ? MOBILE_CLASSES.cardHeader : ''}>
          <CardTitle>My Component</CardTitle>
        </CardHeader>
        <CardBody className={isMobile ? MOBILE_CLASSES.cardBody : ''}>
          Content here
        </CardBody>
      </Card>
    </div>
  )
}

export default MyComponent
```

This approach ensures consistent mobile responsiveness across all components while keeping the code clean and maintainable.
