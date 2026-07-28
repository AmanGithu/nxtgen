# UI/UX Design & Motion Architecture

## 1. Visual Theme (Inspired by Google Stitch)
* **Design System:** Clean borders, structural grids, high contrast, and ample negative space.
* **Color Palette:** Professional dark/light adaptive mode. Deep slates for backgrounds, crisp white/off-black for containers, and a single vivid accent color (e.g., Electric Blue or Violet) for interactive states.
* **Containers:** Rounded corners (`rounded-xl`), subtle borders (`border border-slate-200/50 dark:border-slate-800/50`), and soft drop shadows.

## 2. Motion & Transitions (Inspired by Motionsites)
* **Page Transitions:** Smooth fade-ins and subtle slide-ups (`animate-fade-in-up`) when switching routes.
* **Hover States:** Micro-interactions on all buttons and cards—scale up slightly (`hover:scale-[1.02]`), brighten borders, and shift background opacity smoothly over 200ms (`transition-all duration-200`).
* **Dashboard Layout:** Fixed sidebar with fluid main content window. Zero jarring flashes during data revalidation.