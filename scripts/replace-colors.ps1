# PowerShell script to replace hardcoded colors with CSS variables
# Run from project root: .\scripts\replace-colors.ps1

Write-Host "Replacing hardcoded colors with CSS variables..." -ForegroundColor Green

# Define replacement mappings
$replacements = @{
    # Background colors
    'rgba\(255, 255, 255, 0\.05\)' = 'var(--color-bg-panel)';
    'rgba\(255, 255, 255, 0\.1\)' = 'var(--color-border-light)';
    'rgba\(255, 255, 255, 0\.2\)' = 'var(--color-border-medium)';
    'rgba\(0, 0, 0, 0\.3\)' = 'var(--color-bg-input)';
    'rgba\(0, 0, 0, 0\.95\)' = 'var(--color-bg-tooltip)';
    
    # Accent colors
    'rgba\(66, 185, 131, 0\.1\)' = 'var(--color-accent-light)';
    'rgba\(66, 185, 131, 0\.2\)' = 'var(--color-accent-light)';
    '(rgba\(66, 185, 131, 0\.3\))|( rgba\(66, 185, 131, 0\.4\))' = 'var(--color-accent-medium)';
    'rgba\(66, 185, 131, 0\.5\)' = 'var(--color-accent-strong)';
    '#42b983' = 'var(--color-accent)';
    '#3aa876' = 'var(--color-accent-hover)';
    
    # Danger colors
    'rgba\(239, 68, 68, 0\.2\)' = 'var(--color-danger-light)';
    'rgba\(239, 68, 68, 0\.(3|4)\)' = 'var(--color-danger-medium)';
    'rgba\(239, 68, 68, 0\.5\)' = 'var(--color-danger-strong)';
    '#ef4444' = 'var(--color-danger)';
    '#dc2626' = 'var(--color-danger-hover)';
    
    # Text colors
    '#aaa(aaa)?' = 'var(--color-text-tertiary)';
    '#888(888)?' = 'var(--color-text-muted)';
    '#666(666)?' = 'var(--color-text-secondary)';
    '#ccc(ccc)?' = 'var(--color-text-muted)';
    '(\bwhite\b)|(#fff(fff)?)' = 'var(--color-text-white)';
   
    # Background specific
    '#1a1a1a' = 'var(--color-bg-primary)';
    '#2a2a2a' = 'var(--color-bg-secondary)';
    '#3a3a3a' = 'var(--color-bg-tertiary)';
    
    # Shadows
    '0 4px 12px rgba\(0, 0, 0, 0\.5\)' = 'var(--shadow-tooltip)';
}

# Files to process
$files = @(
    "src\views\AdminView.vue",
    "src\views\ClientView.vue",
    "src\views\HomeView.vue",
    "src\components\SeatTypeModal.vue",
    "src\components\VenueGrid.vue"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..." -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  ✓ Updated $file" -ForegroundColor Green
        } else {
            Write-Host "  - No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nColor replacement complete!" -ForegroundColor Green
Write-Host "Review changes with: git diff" -ForegroundColor Cyan
