---
name: engineering-frontend-developer
description: Frontend implementation guidance for modern web applications, including component architecture, responsive UI, accessibility, state management, performance, and integration with backend APIs. Use when building or reviewing frontend features, translating designs into code, improving UX, or optimizing client-side behavior.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Engineering Frontend Developer

Use this skill to translate product and design requirements into maintainable, accessible, and performant frontend code.

## Operating Principles

- Build for real users first: clarity, responsiveness, accessibility, and reliability.
- Match the existing design system and codebase conventions before inventing new patterns.
- Keep component APIs small, explicit, and easy to compose.
- Optimize for perceived performance and interaction quality, not just bundle metrics.

## Workflow

1. Understand the feature:
   - Identify user goals, interaction states, responsive requirements, and API dependencies.
   - Confirm loading, empty, error, and success states before implementation.
2. Map the UI architecture:
   - Break the work into page structure, reusable components, state ownership, and data-fetch boundaries.
   - Reuse existing primitives when they fit; create new abstractions only when reuse is justified.
3. Implement the experience:
   - Use semantic HTML, accessible interactions, and predictable state transitions.
   - Keep styling consistent with the project's established visual language.
4. Harden the behavior:
   - Handle slow networks, partial data, retries, and optimistic updates deliberately.
   - Prevent layout shift, accidental focus loss, and broken keyboard flows.
5. Verify quality:
   - Check responsiveness, accessibility, integration behavior, and performance-sensitive paths.

## Default Checklist

Before finalizing frontend work, verify:

- Loading, empty, success, and error states are implemented
- Keyboard navigation and focus order make sense
- Semantics and labels support assistive technologies
- Responsive behavior works across the intended breakpoints
- State is owned at the right level and not duplicated unnecessarily
- API integration handles latency, failure, and stale data correctly
- Expensive rendering paths are identified and controlled
- Tests cover critical logic and user-visible regressions

## Component and State Guidance

- Prefer small, focused components with explicit props and minimal hidden coupling.
- Keep business rules close to the state they depend on.
- Avoid over-abstracting early; duplication is acceptable until a stable pattern emerges.
- Use derived state carefully and avoid storing values that can be recomputed cheaply.
- Choose server/client boundaries intentionally when the stack supports both.

## Accessibility and UX Guidance

- Use semantic elements before ARIA; add ARIA only where semantics are insufficient.
- Preserve visible focus states and respect reduced-motion preferences when applicable.
- Ensure forms expose labels, validation feedback, and recovery paths.
- Treat copy, spacing, alignment, and feedback timing as part of the implementation quality.

## Performance Guidance

- Eliminate unnecessary client-side work before adding memoization.
- Reduce bundle weight with selective imports, code splitting, and sensible dependency choices.
- Avoid data-fetch waterfalls and redundant renders.
- Measure with available tooling when performance is a real concern instead of guessing.

## Validation

For significant frontend work, provide:

- UI/component summary
- State and data-flow summary
- Accessibility and responsive checks
- Test/verification notes

## Related Skills

- `@[skills/frontend-design]` for UI patterns and design systems
- `@[skills/web-design-guidelines]` for UX and accessibility audits
- `@[skills/nextjs-react-expert]` for React and Next.js performance work
- `@[skills/testing-patterns]` and `@[skills/webapp-testing]` for verification
- `@[skills/tailwind-patterns]` when styling with Tailwind
