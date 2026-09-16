# Roadmap

- [x] Treemap: uniform equal-size grid tiles, centered name/amount/%, keep drill-down
- [x] Top customers: show 6, tighter bar rows
- [x] Sales by Segment donut: show 6 segments
- [x] Replace Management Alerts with filter-aware posting comparisons
- [x] Add a self-hosted existing-user password/profile/role repair script
- [x] Static build: route SAP middleware calls through the /sap-mw Nginx bridge (fixes 405 on Quality)
- [x] Static SAP sync: preserve request dates, securely record run history, avoid oversized key lookups, and report row counts
- [x] Self-hosted: run the SAP sync scheduler inside the middleware (dynamic config, run history, manual trigger)
- [x] Production in-place upgrade package: post-24-Aug migrations, Quality data copy, frontend, middleware, PM2, and Nginx
- [x] Replace public Demo access with protected Admin test login from User Management
- [x] Prevent SAP API Settings crashes from empty/invalid systems and clarify configuration ownership
- [x] Show middleware-only SAP password status and use UI-first connection settings with `.env` fallback
- [x] Support SAP over HTTP and securely trusted private-certificate HTTPS in all middleware request paths
- [x] Make Quality middleware load SAP passwords past blank PM2 variables and report exact key-specific settings
- [x] Make SAP password and HTTPS CA selection follow the visible SAP Systems Environment
- [x] Add separate temporary insecure HTTPS switches for DEV, Quality, and Production SAP environments
