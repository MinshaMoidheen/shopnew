// Responsive Design Utilities for StockFlow UI

// Common responsive breakpoints
export const BREAKPOINTS = {
  xs: '0px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px'
}

// Responsive column classes
export const RESPONSIVE_COLS = {
  // Single column on mobile, two columns on desktop
  singleToDouble: 'col-12 col-md-6',
  // Single column on mobile, three columns on desktop
  singleToTriple: 'col-12 col-md-4',
  // Single column on mobile, four columns on desktop
  singleToQuad: 'col-12 col-md-3',
  // Two columns on mobile, four columns on desktop
  doubleToQuad: 'col-6 col-md-3',
  // Full width
  fullWidth: 'col-12'
}

// Responsive button classes
export const RESPONSIVE_BUTTONS = {
  // Full width on mobile, auto width on desktop
  fullToAuto: 'w-100 w-md-auto',
  // Full width on mobile, half width on desktop
  fullToHalf: 'w-100 w-md-50',
  // Stack vertically on mobile, horizontally on desktop
  stackToRow: 'd-flex flex-column flex-md-row'
}

// Responsive text alignment
export const RESPONSIVE_TEXT = {
  // Center on mobile, left on desktop
  centerToLeft: 'text-center text-md-start',
  // Center on mobile, right on desktop
  centerToRight: 'text-center text-md-end',
  // Left on mobile, center on desktop
  leftToCenter: 'text-start text-md-center'
}

// Responsive spacing
export const RESPONSIVE_SPACING = {
  // Small margin on mobile, medium on desktop
  smallToMedium: 'mb-2 mb-md-3',
  // Medium margin on mobile, large on desktop
  mediumToLarge: 'mb-3 mb-md-4',
  // No margin on mobile, small on desktop
  noneToSmall: 'mb-0 mb-md-2'
}

// Responsive flex utilities
export const RESPONSIVE_FLEX = {
  // Column on mobile, row on desktop
  columnToRow: 'd-flex flex-column flex-md-row',
  // Column on mobile, row on desktop with gap
  columnToRowGap: 'd-flex flex-column flex-md-row gap-2',
  // Start alignment on mobile, center on desktop
  startToCenter: 'align-items-start align-items-md-center',
  // Start alignment on mobile, end on desktop
  startToEnd: 'align-items-start align-items-md-end'
}

// Responsive container classes
export const RESPONSIVE_CONTAINERS = {
  // Fluid container with responsive padding
  fluid: 'container-fluid px-2 px-md-3',
  // Standard container with responsive padding
  standard: 'container px-2 px-md-3'
}

// DataGrid responsive configuration
export const RESPONSIVE_DATAGRID = {
  // Mobile-friendly column configuration
  mobileColumns: {
    minWidth: 60,
    flex: 1,
    sortable: true
  },
  // Responsive container styles
  containerStyle: {
    height: 400,
    width: '100%',
    overflowX: 'auto'
  }
}

// Form responsive utilities
export const RESPONSIVE_FORMS = {
  // Form group with responsive spacing
  formGroup: 'mb-2 mb-md-3',
  // Form row with responsive columns
  formRow: 'row g-2 g-md-3',
  // Input with responsive sizing
  input: 'form-control',
  // Button group with responsive layout
  buttonGroup: 'd-flex flex-column flex-md-row gap-2'
}

// Card responsive utilities
export const RESPONSIVE_CARDS = {
  // Card with responsive padding
  card: 'card',
  // Card header with responsive text
  cardHeader: 'card-header',
  // Card body with responsive padding
  cardBody: 'card-body p-2 p-md-3',
  // Card title with responsive alignment
  cardTitle: 'card-title text-center text-md-start'
}

// Table responsive utilities
export const RESPONSIVE_TABLES = {
  // Responsive table wrapper
  wrapper: 'table-responsive',
  // Table with responsive styling
  table: 'table table-bordered table-striped',
  // Table cell with responsive text
  cell: 'text-center text-md-start'
}

// Navigation responsive utilities
export const RESPONSIVE_NAV = {
  // Navbar with responsive behavior
  navbar: 'navbar navbar-expand-md',
  // Nav items with responsive layout
  navItems: 'navbar-nav flex-column flex-md-row',
  // Nav link with responsive styling
  navLink: 'nav-link text-center text-md-start'
}

// Utility function to get responsive class combinations
export const getResponsiveClasses = (config) => {
  const classes = []
  
  if (config.cols) classes.push(RESPONSIVE_COLS[config.cols])
  if (config.buttons) classes.push(RESPONSIVE_BUTTONS[config.buttons])
  if (config.text) classes.push(RESPONSIVE_TEXT[config.text])
  if (config.spacing) classes.push(RESPONSIVE_SPACING[config.spacing])
  if (config.flex) classes.push(RESPONSIVE_FLEX[config.flex])
  if (config.container) classes.push(RESPONSIVE_CONTAINERS[config.container])
  
  return classes.join(' ')
}

// Hook for responsive breakpoint detection
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('md')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 576) setBreakpoint('xs')
      else if (width < 768) setBreakpoint('sm')
      else if (width < 992) setBreakpoint('md')
      else if (width < 1200) setBreakpoint('lg')
      else if (width < 1400) setBreakpoint('xl')
      else setBreakpoint('xxl')
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return breakpoint
}

export default {
  BREAKPOINTS,
  RESPONSIVE_COLS,
  RESPONSIVE_BUTTONS,
  RESPONSIVE_TEXT,
  RESPONSIVE_SPACING,
  RESPONSIVE_FLEX,
  RESPONSIVE_CONTAINERS,
  RESPONSIVE_DATAGRID,
  RESPONSIVE_FORMS,
  RESPONSIVE_CARDS,
  RESPONSIVE_TABLES,
  RESPONSIVE_NAV,
  getResponsiveClasses,
  useResponsive
}
