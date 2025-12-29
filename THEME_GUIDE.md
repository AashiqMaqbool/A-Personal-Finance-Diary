# 🎨 FinDiary Enterprise Theme

## Color Palette

### Primary (Black)
- **Use:** Main UI elements, text, primary buttons
- **Shades:** `primary-50` to `primary-950`
- **Main:** `primary-900` (#212529)

### Success (Green)
- **Use:** Success states, positive actions, completed items
- **Shades:** `success-50` to `success-900`
- **Main:** `success-600` (#16a34a)

### Warning (Yellow)
- **Use:** Warnings, pending states, alerts
- **Shades:** `warning-50` to `warning-900`
- **Main:** `warning-500` (#eab308)

### Danger (Red)
- **Use:** Errors, delete actions, critical alerts
- **Shades:** `danger-50` to `danger-900`
- **Main:** `danger-600` (#dc2626)

### AI Gradient (Purple-Indigo-Blue)
- **Use:** AI features, smart recommendations, analytics
- **Colors:** Purple → Indigo → Blue
- **Class:** `bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600`

## Button Classes

```jsx
// Primary Black Button
<button className="btn-primary">Primary Action</button>

// Success Green Button
<button className="btn-success">Save</button>

// Warning Yellow Button
<button className="btn-warning">Warning</button>

// Danger Red Button
<button className="btn-danger">Delete</button>

// AI Gradient Button
<button className="btn-ai">AI Analyzer</button>
```

## Card Classes

```jsx
// Standard Card
<div className="card p-6">Content</div>

// With specific colors
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  Content
</div>
```

## Badge Classes

```jsx
// Primary Badge
<span className="badge bg-primary-900 text-white">Active</span>

// Success Badge
<span className="badge bg-success-600 text-white">Completed</span>

// Warning Badge
<span className="badge bg-warning-500 text-primary-900">Pending</span>

// Danger Badge
<span className="badge bg-danger-600 text-white">Overdue</span>
```

## Responsive Design

All components use Tailwind's responsive utilities:
- `sm:` - Small screens (640px+)
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)
- `xl:` - Extra large screens (1280px+)

Example:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

## Spacing & Gaps

- **Padding:** `p-4`, `p-6`, `p-8`
- **Margin:** `m-4`, `m-6`, `m-8`
- **Gap:** `gap-2`, `gap-4`, `gap-6`
- **Space:** `space-y-4`, `space-x-4`

## Typography

- **Headings:** `text-4xl font-bold`, `text-2xl font-semibold`
- **Body:** `text-sm`, `text-base`
- **Small:** `text-xs`
- **Colors:** `text-primary-900`, `text-success-600`, etc.

## Usage Examples

### Success State
```jsx
<div className="bg-success-50 border border-success-200 rounded-xl p-4">
  <p className="text-success-900">Success message</p>
</div>
```

### Warning State
```jsx
<div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
  <p className="text-warning-900">Warning message</p>
</div>
```

### Error State
```jsx
<div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
  <p className="text-danger-900">Error message</p>
</div>
```

### AI Feature
```jsx
<button className="btn-ai flex items-center gap-2">
  <Sparkles className="w-5 h-5" />
  AI Analyzer
</button>
```

## Zero Code Breakage

All existing Tailwind classes still work:
- `bg-slate-900` → Use `bg-primary-900`
- `bg-green-600` → Use `bg-success-600`
- `bg-yellow-500` → Use `bg-warning-500`
- `bg-red-600` → Use `bg-danger-600`
- `bg-purple-600` → Use for AI features

The theme is additive - old classes work, new classes provide consistency.
