# User Interface Description Document: CNCCUT.APP

**Version:** 1.1
**Date:** 2025-04-21
**Based On:** Product Requirements Document v0.1, Guided Dashboard Concept, User Colour Palette Feedback

## Layout Structure

* **Primary Interface:** Dashboard-centric upon user login.
* **Main Regions:**
    * Persistent Header: Logo, primary navigation links (e.g., New Part, Order History, Account), user profile access.
    * Main Content Area: Displays dashboard widgets, configuration steps, order details, etc. Changes based on user context.
    * Configuration View: Dominated by a large interactive 3D visualiser, with configuration steps/options presented clearly, often in a dedicated panel or sequence.
* **Navigation:** Clear top-level navigation. Configuration uses a step-by-step (wizard) pattern.

## Core Components

* **Dashboard Widgets:** Summaries of active orders, recent quotes/configurations, quick start buttons ("Start New Part", "Browse Library").
* **Configuration Wizard:** Multi-step interface guiding users through shape selection, dimension input, material/finish choices, and feature definition. Includes clear progress indicators.
* **Interactive 3D Visualiser:** Real-time, accurate rendering of the configured part. Supports rotation, zoom, and pan. Updates dynamically as parameters change.
* **Parameter Input Fields:** Primarily numerical inputs for dimensions, dropdowns for selections (materials, thicknesses, standard features), quantity counters.
* **Real-Time Quoting Display:** Clearly visible area showing calculated price and estimated lead time, updating instantly.
* **Order History Table:** Lists past and current orders with key details (Order ID, Date, Status, Cost) and links to view details.
* **Shopping Cart:** Standard e-commerce cart functionality for reviewing and finalising orders.
* **User Account Management:** Standard forms for profile, address, and potentially saved payment details.

## Interaction patterns

* **Guided Configuration:** Step-by-step wizard flow for creating custom parts. Users are led through required choices sequentially.
* **Direct Manipulation (Visualiser):** Standard mouse/touch controls for interacting with the 3D model (rotate, zoom, pan).
* **Real-time Feedback:** Instant updates in the visualiser, price, and lead time as configuration parameters are changed.
* **Standard Form Interactions:** Use of clear input fields, dropdowns, buttons, and potentially toggles/checkboxes for options.
* **Dashboard Navigation:** Clicking widgets or main navigation items transitions the user to the relevant section (e.g., order details, new configuration flow).

## Visual Design Elements & Color Scheme

* **Overall Aesthetic:** Modern, clean, professional, efficient, slightly technical. Conveys reliability and precision.
* **Color Scheme:** Primarily dark mode.
    * **Backgrounds:** Deep greys or near-black shades (similar to the dark colours in the provided palette) for the main interface background.
    * **Primary Accent:** Your main red (`#B80F0A`) used for key calls-to-action (buttons like "Add to Cart", "Confirm Order"), active state indicators, progress bars, and important highlights. Use judiciously to draw attention.
    * **Secondary Accent / Depth:** The dark red (`#351210`) can be used for subtler accents, secondary buttons, or potentially adding depth to background elements where appropriate, ensuring it doesn't clash with the primary red.
    * **Text & Contrast Elements:** A high-contrast off-white or light beige (like the lighter shades in the provided palette) for all body text, labels, and data readouts to ensure excellent readability against the dark backgrounds.
    * **Neutral Accents:** The mid-grey from the palette can be used for borders, dividers, or disabled states.
* **Iconography:** Crisp, clear, and universally understood icons. Style should be consistent and professional. Icons should likely use the high-contrast text colour, potentially using the primary red (`#B80F0A`) for active/selected states where suitable.
* **Visualiser:** Needs to render materials and edge finishes accurately, prioritising form and dimension clarity. Background within the visualiser should provide good contrast to the rendered timber parts.

## Mobile, Web App, Desktop considerations

* **Primary Platform:** Desktop web browsers. The interface must be optimised for typical desktop screen resolutions and mouse/keyboard interaction.
* **Responsive Design:** While desktop-first, the layout should adapt gracefully to smaller tablet-sized screens where possible. Key information (like order status) should remain accessible.
* **Mobile:** Full configuration workflow might be cumbersome on mobile. Focus mobile usability on viewing order status, accessing account details, and potentially Browse past orders. A fully dedicated mobile configuration experience is secondary.

## Typography

* **Font Choice:** Sans-serif font family prioritising readability and clarity, especially for numerical data. Should feel modern and professional (e.g., Inter, Roboto, Source Sans Pro or similar).
* **Hierarchy:** Clear visual hierarchy using font size, weight (boldness), and colour contrast to distinguish headings, subheadings, body text, labels, and data points.
* **Readability:** Sufficient line spacing and padding around text elements. Ensure high contrast between text and background, per the chosen colour scheme.

## Accessibility

* **Colour Contrast:** Adhere to WCAG AA standards for text/background contrast, particularly between the light beige/off-white text (`#FAF0E6` ballpark from palette) and dark backgrounds, and for the red accent (`#B80F0A`) used on controls against its background. Verify contrast for all interactive states.
* **Keyboard Navigation:** Ensure all interactive elements (buttons, inputs, links, visualiser controls) are fully navigable and operable using a keyboard.
* **Screen Reader Support:** Use semantic HTML structure. Provide appropriate ARIA attributes where necessary, especially for custom components like the visualiser and wizard steps. Label all form inputs clearly. Provide text alternatives for informative icons.
* **Focus Indicators:** Clear and visible focus indicators for keyboard navigation, potentially using the primary red (`#B80F0A`) or a distinct outline that contrasts well.
* **Font Sizing:** Use relative units (rem/em) for fonts to allow users to resize text via browser settings.