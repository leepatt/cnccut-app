# Product Requirements Document: CNCCUT.APP

**Version:** 0.5
**Date:** 2025-04-21
**Author:** Gemini (AI Product Manager) for Craftons/CNC Cut
**Context:** Serving professional clients Australia-wide.

## 1. Elevator Pitch

CNCCUT.APP effectively puts **a CNC facility in the pocket** of professional builders, designers, and makers across Australia, delivering **precision timber components** with unparalleled **accuracy, efficiency, and speed**. It's the essential online tool that eliminates endless email threads and quoting delays. Users select standard parametric items (panels, boxes, curves etc.), customise details (dimensions, material, finish, connections), instantly visualise their creation with an **interactive 3D preview**, and get **real-time pricing and precise lead times**. The app provides seamless access to advanced manufacturing, automatically generating production-ready DXF files for CNC Cut's workflow, ensuring budget certainty and swift project execution – like having CNC capability readily available, on demand.

## 2. Who is this app for?

This is a professional tool built exclusively for the Australian market, targeting:

* **Smart Builders:** Seeking **reliable, rapid solutions** for custom timber components on construction projects.
* **Designers:** (Interior, Furniture, Architectural) Specifying **unique elements with exact requirements**, from details to bespoke furniture.
* **Makers & Manufacturers:** (Cabinet Makers, Shopfitters, Joiners), **especially those without their own in-house CNC capabilities,** requiring **precision-cut parts delivered on time, every time.**

It's **not** for hobbyists. Minimum order quantities/costs reflect its professional focus, targeting users needing multiple parts, higher volumes, or complex projects requiring instant access to professional CNC output.

## 3. Functional Requirements

The app must provide **on-demand access to CNC capabilities** through a seamless digital experience, allowing users to:

* **User Accounts:**
    * Register and log in securely.
    * Manage profile and saved details.
* **Product Selection:**
    * Browse a library of standard parametric timber products.
* **Customisation Engine:**
    * Input custom dimensions.
    * Select material type and thickness from a dropdown reflecting current stock and ETA.
    * Specify quantity.
    * Choose edge finishes and other item-specific features.
* **Interactive Visualiser:**
    * Display a real-time, interactive 3D preview of the customised part.
* **Real-Time Quoting:**
    * Calculate and display the total cost instantly (**transparent pricing**).
    * Estimate production timeframe (**precise lead times**).
* **Ordering & Payment:**
    * Add items to a cart.
    * Securely process payments.
    * Facilitate **Australia-wide shipping**.
* **Production File Generation:**
    * Automatically generate accurate DXF files (**error-free**) upon order for CNC Cut's machines.
    * (Future) Support for STEP file generation.
* **User Dashboard:**
    * Provide a **convenient location** to **manage projects**.
    * View order history.
    * **Track order status in real-time.**
    * **Easily reorder favourite configurations.**
* **System Capabilities:**
    * The backend manufacturing system supports **large format materials (up to 5.4m x 1.8m)** via 3-axis CNC, enabling a wide range of component sizes.
    * Capable of handling **high-volume and high-complexity** orders.
* **(Future) User File Upload:**
    * Allow users to upload their own DXF and STEP files for quoting and ordering.

## 4. User Stories

* **As a designer,** I want to log in to my account so I can easily access project history and reorder a previous configuration.
* **As a builder,** I want to select a standard template so I can quickly start customising it for a time-sensitive job.
* **As a cabinet maker without my own CNC,** I want to input exact dimensions and specifications so I get precisely the part I need for my assembly without investing in machinery.
* **As a user,** I want the interactive 3D preview to update instantly so I can confidently approve the design before ordering.
* **As a shopfitter,** I want to see stock levels and accurate lead times upfront so I can reliably schedule my installation.
* **As a designer,** I want an instant price calculation so I can immediately confirm budget viability.
* **As a user,** I want a simple checkout process with clear shipping costs across Australia.
* **As a builder,** I want email confirmation and access to a dashboard so I can easily track my order's progress from production to delivery.
* **(Future) As a maker,** I want to upload my complex DXF file to get a quote without needing to recreate it using standard templates.

## 5. User Interface (UI)

* **Overall Style:** Modern, clean, professional, slightly technical aesthetic. Reinforces **reliability, efficiency, and professional quality.**
* **Colour Scheme:** Dark mode preferred. High contrast for readability.
* **Brand Colours:**
    * Primary Red: `#B80F0A`
    * Dark Red: `#351210`
    * These should be used strategically (e.g., for branding accents, calls-to-action).
    * Complementary/contrasting colours (e.g., light greys, off-whites, potentially a neutral accent colour) are needed for text, backgrounds, UI elements, and data visualisation to ensure excellent readability and hierarchy within the dark theme.
* **Layout:** **Streamlined** dashboard interface. Clear navigation focused on efficiency.
* **Customisation Interface:** Intuitive controls (inputs, dropdowns). Designed for speed and accuracy.
* **Visualiser:** Prominent, high-quality, smooth real-time interaction. Key for user confidence.
* **Responsiveness:** Primary focus on desktop browsers. Mobile usable for status checks/simple tasks.
* **Goal:** Simplify the user's workflow, provide a competitive edge, and make **complex manufacturing feel accessible and immediate** through a superior digital experience..