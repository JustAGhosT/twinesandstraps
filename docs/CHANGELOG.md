# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-11-25

### Changed - Azure AI Foundry Migration & Documentation Update

#### What Changed:
1. **Replaced OpenAI with Azure AI Foundry**
   - Removed OpenAI dependency from package.json (was unused)
   - Updated documentation to reference Azure AI Foundry instead of OpenAI
   - Updated next.config.js to remove OpenAI-specific image hostname
   
2. **Added Comprehensive Setup Instructions**
   - Added detailed instructions in .env.example for all required keys and secrets
   - Added step-by-step guides for obtaining:
     - Database connection strings (Neon, PlanetScale, Supabase, Turso)
     - WhatsApp Business number configuration
     - Azure AI Foundry credentials
     - Netlify deployment credentials
   - Updated README.md with environment variables table and setup guides
   - Updated DEPLOYMENT_PIPELINE.md with complete credentials documentation

3. **Documentation Updates**
   - README.md: Updated AI features section and environment variables
   - .env.example: Comprehensive configuration file with detailed comments
   - docs/DEPLOYMENT_PIPELINE.md: Added all environment variables and credentials guide

#### Configuration Required:
See `.env.example` for complete list of environment variables and instructions.

---

## [Unreleased] - 2025-11-24

### Changed - Client Requirements Update

Based on client feedback, the business model has been updated from direct e-commerce sales to a quote-based approach:

#### What Changed:
1. **Removed Direct Sales Functionality**
   - Removed "Add to Cart" functionality
   - Removed cart icon from header
   - No longer implementing PayFast payment integration (as per original PRD)

2. **Removed VAT Display**
   - Removed VAT calculations and display from product cards
   - Removed VAT information from product detail pages
   - Client is VAT registered but won't be selling directly, so VAT display not needed

3. **Added WhatsApp Quote Integration**
   - Replaced "Add to Cart" with "Request Quote via WhatsApp" button
   - Quote request includes: product name, SKU, quantity, unit price, and total
   - WhatsApp number configurable via `NEXT_PUBLIC_WHATSAPP_NUMBER` environment variable

4. **Updated Messaging**
   - Homepage updated to emphasize quote requests over direct sales
   - Business buyer section updated to mention WhatsApp for personalized quotes

#### Configuration Required:
Set the following environment variable in Netlify:
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: Your WhatsApp business number (format: 27XXXXXXXXX without + or spaces)

#### Notes:
- Original PRD (docs/PRD.md) describes the full e-commerce vision with cart, checkout, and PayFast integration
- Current implementation focuses on product catalog and quote requests via WhatsApp
- Product specifications are fully displayed on product detail pages as requested
- The quote-based approach allows the business to maintain control over pricing and negotiations
