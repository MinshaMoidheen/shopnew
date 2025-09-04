// Mobile Styles Utility
// This file provides utility functions and constants for mobile responsive design

// Import the mobile styles
import '@src/assets/scss/mobile-responsive.scss'

// Mobile breakpoint constant
export const MOBILE_BREAKPOINT = 767

// Mobile detection utility
export const isMobileView = () => {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

// Theme detection utility
export const getCurrentTheme = () => {
  const skin = localStorage.getItem('skin')
  if (skin?.toLowerCase()?.includes('dark')) {
    return 'dark'
  }
  return 'light'
}

// Mobile container styles
export const getMobileContainerStyles = (isMobile) => ({
  height: isMobile ? "calc(100vh - 60px)" : "calc(100vh - 100px)",
  overflow: "auto",
  padding: isMobile ? '0' : '0',
  margin: isMobile ? '0' : '0',
  width: isMobile ? '100vw' : '100%',
  maxWidth: isMobile ? '100vw' : '100%',
  position: isMobile ? 'fixed' : undefined,
  top: isMobile ? '60px' : undefined,
  left: isMobile ? '0' : undefined,
  right: isMobile ? '0' : undefined,
  bottom: isMobile ? '0' : undefined,
  zIndex: isMobile ? '1000' : undefined
})

// Inner container styles
export const getInnerContainerStyles = (isMobile) => ({
  width: isMobile ? '100%' : '100%',
  height: isMobile ? 'calc(100vh - 60px)' : 'auto',
  margin: isMobile ? '0' : '0',
  padding: isMobile ? '10px' : '0',
  position: isMobile ? 'relative' : undefined,
  top: isMobile ? '40px' : undefined,
  left: isMobile ? '0' : undefined,
  right: isMobile ? '0' : undefined,
  bottom: isMobile ? '0' : undefined,
  maxWidth: isMobile ? '100%' : '100%',
  boxSizing: 'border-box'
})

// Card styles with theme support
export const getCardStyles = (isMobile, isDarkTheme) => ({
  backgroundColor: isDarkTheme ? '#181c2e' : '#ffffff',
  border: isDarkTheme ? '1px solid #2d3748' : '1px solid #e2e8f0',
  color: isDarkTheme ? '#ffffff' : '#000000'
})

// Card header styles with theme support
export const getCardHeaderStyles = (isMobile, isDarkTheme) => ({
  backgroundColor: isDarkTheme ? '#2d3748' : '#f8f9fa',
  borderBottom: isDarkTheme ? '1px solid #4a5568' : '1px solid #e2e8f0'
})

// Text styles with theme support
export const getTextStyles = (isMobile, isDarkTheme, fontSize = '16px') => ({
  color: isDarkTheme ? '#ffffff' : '#000000',
  fontSize: isMobile ? fontSize : fontSize
})

// Mobile class names
export const MOBILE_CLASSES = {
  container: 'mobile-container',
  card: 'mobile-card',
  cardHeader: 'mobile-card-header',
  cardBody: 'mobile-card-body',
  statsCard: 'mobile-stats-card',
  statsTitle: 'mobile-stats-title',
  statsValue: 'mobile-stats-value',
  avatar: 'mobile-avatar',
  table: 'mobile-table',
  tableContainer: 'mobile-table-container',
  button: 'mobile-button',
  buttonContainer: 'mobile-button-container',
  formSection: 'mobile-form-section',
  formInput: 'mobile-form-input',
  searchSection: 'mobile-search-section',
  searchInput: 'mobile-search-input',
  addButton: 'mobile-add-button',
  itemCard: 'mobile-item-card',
  removeContainer: 'mobile-remove-container',
  removeBtn: 'mobile-remove-btn',
  actionButtons: 'mobile-action-buttons',
  actionBtn: 'mobile-action-btn',
  amountCards: 'mobile-amount-cards',
  amountCard: 'mobile-amount-card',
  filterButtons: 'mobile-filter-buttons',
  filterBtn: 'mobile-filter-btn',
  dataGrid: 'mobile-datagrid'
}

// Common mobile responsive patterns
export const MOBILE_PATTERNS = {
  // Two column layout for mobile
  twoColumn: (isMobile) => isMobile ? 'xs-6' : 'lg-3',
  
  // Full width layout for mobile
  fullWidth: (isMobile) => isMobile ? 'xs-12' : 'lg-12',
  
  // Half width layout for mobile
  halfWidth: (isMobile) => isMobile ? 'xs-12' : 'lg-6',
  
  // Flex direction for mobile
  flexDirection: (isMobile) => isMobile ? 'flex-column' : 'flex-row',
  
  // Gap for mobile
  gap: (isMobile) => isMobile ? 'gap-2' : 'gap-1',
  
  // Font size for mobile
  fontSize: (isMobile, desktopSize = '16px') => isMobile ? '14px' : desktopSize,
  
  // Icon size for mobile
  iconSize: (isMobile, desktopSize = 20) => isMobile ? 16 : desktopSize,
  
  // Button text for mobile (shortened)
  buttonText: (isMobile, fullText, shortText) => isMobile ? shortText : fullText
}

export default {
  MOBILE_BREAKPOINT,
  isMobileView,
  getCurrentTheme,
  getMobileContainerStyles,
  getInnerContainerStyles,
  getCardStyles,
  getCardHeaderStyles,
  getTextStyles,
  MOBILE_CLASSES,
  MOBILE_PATTERNS
}
