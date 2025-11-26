# Improvement Phases

Roadmap for implementing website improvements in phases.

---

## Completed: Quick Wins

- [x] Fix cart product images - show actual images instead of placeholder
- [x] Add search functionality to header with filtering on products page
- [x] Fix inconsistent button colors (blue → brand primary-600)
- [x] Add About page to navigation (desktop and mobile)
- [x] Add floating WhatsApp button for instant contact
- [x] Add VAT display in cart summary (15% SA VAT breakdown)
- [x] Add images to category cards on homepage

---

## Phase 1: User Experience Enhancements

**Focus:** Improve navigation, product discovery, and shopping flow

| Task | Priority | Complexity |
|------|----------|------------|
| Add breadcrumbs on product detail pages | High | Low |
| Add "Add to Cart" button on product listing cards | High | Medium |
| Create inline quote form on `/quote` page | High | Medium |
| Add back-to-top button for long pages | Medium | Low |
| Add loading skeletons for products | Medium | Low |
| Add product image zoom on detail page | Medium | Medium |
| Improve empty cart state with recommendations | Low | Low |

---

## Phase 2: E-commerce Features

**Focus:** Enhance shopping capabilities and product filtering

| Task | Priority | Complexity |
|------|----------|------------|
| Add product filtering by material | High | Medium |
| Add product filtering by diameter range | High | Medium |
| Add price range filter (slider) | Medium | Medium |
| Add "Related Products" section on product pages | High | Medium |
| Show "Only X left" for low stock items | Medium | Low |
| Add product comparison feature | Low | High |
| Add wishlist/save for later functionality | Low | High |
| Add minimum order quantities display | Medium | Low |
| Show delivery/shipping information | Medium | Medium |

---

## Phase 3: SEO & Performance

**Focus:** Improve search engine visibility and site performance

| Task | Priority | Complexity |
|------|----------|------------|
| Add Open Graph meta tags for social sharing | High | Low |
| Add Twitter card meta tags | High | Low |
| Add JSON-LD structured data for products | High | Medium |
| Create sitemap.xml | High | Low |
| Create robots.txt | High | Low |
| Add canonical URLs | Medium | Low |
| Add dynamic meta titles/descriptions per page | High | Medium |
| Add blur placeholders for loading images | Medium | Low |
| Consider ISR for product listings | Medium | Medium |
| Add custom Next.js font loading | Low | Low |

---

## Phase 4: Trust & Conversion

**Focus:** Build credibility and improve conversion rates

| Task | Priority | Complexity |
|------|----------|------------|
| Add customer testimonials section | High | Medium |
| Display company physical address | High | Low |
| Add certifications/trust badges | Medium | Low |
| Add newsletter signup form | Medium | Medium |
| Add return/warranty policy page | Medium | Low |
| Add social media links to footer | Medium | Low |
| Add FAQ accordion on contact page | Low | Low |
| Add live chat integration option | Low | High |

---

## Phase 5: Accessibility & Technical

**Focus:** Improve accessibility and technical robustness

| Task | Priority | Complexity |
|------|----------|------------|
| Add skip-to-content link | High | Low |
| Improve focus indicators on interactive elements | High | Low |
| Fix low contrast text (gray-400 → gray-500) | High | Low |
| Add more descriptive aria-labels | Medium | Low |
| Create custom 404 page | High | Low |
| Add React error boundaries | Medium | Medium |
| Integrate analytics (Google Analytics / Plausible) | Medium | Medium |
| Add service worker for PWA support | Low | High |
| Add multi-tab cart synchronization | Low | Medium |
| Add environment variable validation | Low | Low |

---

## Phase 6: Future Considerations

**Focus:** Long-term enhancements (evaluate based on business needs)

| Task | Priority | Complexity |
|------|----------|------------|
| Add Afrikaans language support | Low | High |
| Add user accounts/authentication | Low | High |
| Add order history for registered users | Low | High |
| Implement full checkout flow | Low | Very High |
| Add inventory management admin panel | Low | Very High |
| Integrate with payment gateway | Low | Very High |

---

## Implementation Notes

### Priority Levels
- **High:** Critical for user experience or business value
- **Medium:** Important but not urgent
- **Low:** Nice to have, can be deferred

### Complexity Levels
- **Low:** < 2 hours of work
- **Medium:** 2-8 hours of work
- **High:** 1-3 days of work
- **Very High:** > 3 days of work

### Recommended Order
1. Complete Phase 1 first (UX is highest impact)
2. Phase 2 and 3 can run in parallel
3. Phase 4 should follow after core features are solid
4. Phase 5 can be integrated throughout
5. Phase 6 requires business decisions

---

## Technical Dependencies

Some features have dependencies on others:

- **Product filtering** requires search functionality (✅ Done)
- **Related products** requires category data (✅ Available)
- **ISR** requires stable product data structure
- **PWA** requires service worker and manifest
- **Checkout flow** requires user authentication and payment integration

---

*Last Updated: November 2025*
