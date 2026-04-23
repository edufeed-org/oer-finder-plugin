# Evaluation Report: oer-finder-plugin
 
## Overview
 
The `oer-finder-plugin` was integrated on a trial basis across three projects to evaluate its functionality, compatibility, and performance:
 
1. [edufeed-org/kanban-editor](https://github.com/edufeed-org/kanban-editor)
2. [b310-digital/teammapper](https://github.com/b310-digital/teammapper/pull/1081)
3. [b310-digital/groupwriter](https://github.com/b310-digital/groupwriter/pull/75)
This report documents the issues discovered and resolved during integration, current limitations, and recommended next steps.
---
 
## Issues Discovered and Resolved
 
### Cross-Framework Compatibility
 
During integration testing, several bugs were uncovered when embedding the plugin into different frontend frameworks, specifically Svelte, React, and Angular. These issues have been addressed, and the plugin now integrates cleanly across all three environments.
 
### Proxy Blocking on Hetzner Infrastructure
 
The proxy service, hosted on Hetzner for the kanban-editor integration, was found to be blocked by certain source adapters. Some upstream OER providers appear to reject requests originating from Hetzner IP ranges. As a result, the **client-only mode** was optimized as an alternative path. This mode is a natural fit for Nostr-based applications that typically operate without a backend. Conversely, applications with privacy requirements may still need the proxy to prevent users from connecting to external sources directly. In those cases, an alternative hosting environment for the proxy should be considered.
 
### Bundle Size and Loading Performance
 
Loading times were drastically improved by optimizing the build pipeline through tree shaking. The key change was making source adapter inclusion selective: adapters that are not needed (e.g., the Nostr adapter for non-Nostr use cases) are tree-shaken from the bundle and no longer included in the package. This reduces the initial payload and speeds up time-to-interactive.
 
### Theming and Customization
 
The plugin's styling system was enhanced so that it can be integrated seamlessly into host applications with custom color schemes. Developers can now override default colors to match their application's design language without resorting to fragile CSS overrides.
 
### Flexible Resource Type Filtering
 
The AMB metadata format allows some ambiguity in how resource types are defined, both in terms of identifier format and language. For example, a resource type might be expressed as `learningResourceType:id=http://w3id.org/kim/hcrt/image` or alternatively as `learningResourceType:prefLabel@en=Image`. To handle this, a broad filtering strategy with fallback matching was implemented, ensuring that resources are surfaced correctly regardless of how their type metadata is structured.
 
---
 
## Limitations
 
### Package Distribution via GitHub Registry
 
The plugin is currently published to the GitHub Package Registry. While this simplifies the build and release workflow, it introduces friction for consumers: downloading packages from GitHub's registry requires a `github_token`, even for public packages. This makes adoption unnecessarily complex for external developers who simply want to install and use the plugin.
 
