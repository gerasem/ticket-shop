# Color Replacement Map

This document maps all hardcoded colors to CSS variables for systematic replacement.

## Replacement Rules

### Background Colors
| Hardcoded | CSS Variable |
|-----------|--------------|
| `rgba(255, 255, 255, 0.05)` | `var(--color-bg-panel)` |
| `rgba(255, 255, 255, 0.1)` | `var(--color-border-light)` |
| `rgba(255, 255, 255, 0.2)` | `var(--color-border-medium)` |
| `rgba(0, 0, 0, 0.3)` | `var(--color-bg-input)` |
| `rgba(0, 0, 0, 0.95)` | `var(--color-bg-tooltip)` |
| `#1a1a1a` | `var(--color-bg-primary)` |
| `#2a2a2a` | `var(--color-bg-secondary)` |
| `#3a3a3a` | `var(--color-bg-tertiary)` |

### Accent Colors (Green #42b983)
| Hardcoded | CSS Variable |
|-----------|--------------|
| `#42b983` | `var(--color-accent)` |
| `#3aa876` | `var(--color-accent-hover)` |
| `rgba(66, 185, 131, 0.1)` | `var(--color-accent-light)` |
| `rgba(66, 185, 131, 0.2)` | `var(--color-accent-light)` (dark) |
| `rgba(66, 185, 131, 0.3)` | `var(--color-accent-medium)` |
| `rgba(66, 185, 131, 0.4)` | `var(--color-accent-medium)` (dark) |
| `rgba(66, 185, 131, 0.5)` | `var(--color-accent-strong)` |

### Danger Colors (Red #ef4444)
| Hardcoded | CSS Variable |
|-----------|--------------|
| `#ef4444` | `var(--color-danger)` |
| `#dc2626` | `var(--color-danger-hover)` |
| `rgba(239, 68, 68, 0.2)` | `var(--color-danger-light)` |
| `rgba(239, 68, 68, 0.4)` | `var(--color-danger-medium)` |
| `rgba(239, 68, 68, 0.5)` | `var(--color-danger-strong)` |

### Text Colors
| Hardcoded | CSS Variable |
|-----------|--------------|
| `#aaa` or `#aaaaaa` | `var(--color-text-tertiary)` |
| `#888` or `#888888` | `var(--color-text-muted)` (dark) |
| `#666` or `#666666` | `var(--color-text-secondary)` |
| `#ccc` or `#cccccc` | `var(--color-text-muted)` |
| `white` or `#fff` or `#ffffff` | `var(--color-text-white)` |

### Seat Colors (DO NOT CHANGE - Keep Fixed)
| Color | CSS Variable |
|-------|--------------|
| `#4a5568` | `var(--color-seat-standard)` |
| `#3b82f6` | `var(--color-seat-premium)` |
| `#f59e0b` | `var(--color-seat-vip)` |
| `#42b983` (selected) | `var(--color-seat-selected)` |
| `#ef4444` (booked) | `var(--color-seat-booked)` |
| `#9b59b6` (admin) | `var(--color-seat-admin)` |
| `#f39c12` (price) | `var(--color-seat-price)` |

### Shadows
| Hardcoded | CSS Variable |
|-----------|--------------|
| `0 4px 12px rgba(0, 0, 0, 0.5)` | `var(--shadow-tooltip)` |

## Files to Update
- ✅ theme.css - Updated with all variables
- ⏳ AdminView.vue - ~50 color replacements needed
- ⏳ ClientView.vue - ~30 color replacements needed  
- ⏳ HomeView.vue - ~5 color replacements needed
- ⏳ SeatTypeModal.vue - ~20 color replacements needed
- ⏳ VenueGrid.vue - ~5 color replacements needed
