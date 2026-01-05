# =============================================================================
# SAUDAPAKKA - PROJECT FILE STRUCTURE
# =============================================================================
# Generated: 2026-01-05
# This document lists all important project files for reference

saudapakka-full/
│
├── .env.production.example      # Production environment template
├── .gitignore                   # Git ignore rules
├── docker-compose.yml           # Development docker compose
├── docker-compose.prod.yml      # Production docker compose (postgres + backend + frontend + nginx)
├── nginx.conf                   # Nginx reverse proxy config
├── FILE_STRUCTURE.md            # This file
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions - auto deploy to VPS 72.61.246.159
│
├── saudapakka_backend/
│   ├── .env.production          # Backend production env vars
│   ├── Dockerfile               # Production Dockerfile (Python + Gunicorn)
│   ├── entrypoint.sh            # Docker entrypoint (wait-for-db + migrations)
│   ├── requirements.txt         # Python dependencies (Django, DRF, etc.)
│   │
│   └── src/
│       ├── manage.py            # Django management script
│       │
│       ├── saudapakka/          # Django project settings
│       │   ├── __init__.py
│       │   ├── settings.py      # ⚡ Main settings (SECURITY HARDENED)
│       │   ├── urls.py          # Root URL config + /health endpoint
│       │   ├── wsgi.py          # WSGI config for Gunicorn
│       │   └── asgi.py          # ASGI config
│       │
│       └── apps/                # Django applications
│           ├── __init__.py
│           │
│           ├── users/           # User authentication & KYC
│           │   ├── __init__.py
│           │   ├── admin.py
│           │   ├── apps.py
│           │   ├── models.py    # User, KYCVerification, BrokerProfile
│           │   ├── serializers.py
│           │   ├── services.py  # Sandbox KYC client
│           │   ├── urls.py
│           │   ├── views.py     # Auth, KYC, Profile, Admin views
│           │   └── migrations/
│           │
│           ├── properties/      # Property listings
│           │   ├── __init__.py
│           │   ├── admin.py
│           │   ├── apps.py
│           │   ├── models.py    # Property, PropertyImage, SavedProperty
│           │   ├── permissions.py
│           │   ├── serializers.py
│           │   ├── urls.py
│           │   ├── views.py     # PropertyViewSet, image upload, save/recent
│           │   └── migrations/
│           │
│           ├── mandates/        # Legal mandate/contract system
│           │   ├── __init__.py
│           │   ├── admin.py
│           │   ├── apps.py
│           │   ├── models.py    # Mandate model
│           │   ├── serializers.py
│           │   ├── urls.py
│           │   ├── views.py     # MandateViewSet
│           │   └── migrations/
│           │
│           └── admin_panel/     # Super admin dashboard
│               ├── __init__.py
│               ├── admin.py
│               ├── apps.py
│               ├── models.py
│               ├── urls.py
│               ├── views.py     # Stats, property/user management
│               └── migrations/
│
└── saudapakka_frontend/
    ├── .gitignore
    ├── Dockerfile               # Production multi-stage Dockerfile (Node + Next.js)
    ├── env.production.template  # Frontend env vars template
    ├── next.config.ts           # ⚡ Next.js config (standalone output)
    ├── package.json             # Node dependencies
    ├── package-lock.json
    ├── tsconfig.json
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    │
    ├── public/                  # Static assets
    │   ├── favicon.ico
    │   ├── file.svg
    │   ├── globe.svg
    │   ├── next.svg
    │   └── vercel.svg
    │
    └── src/
        ├── lib/
        │   ├── axios.ts         # ⚡ API client (uses NEXT_PUBLIC_API_URL)
        │   └── utils.ts         # Utility functions
        │
        ├── hooks/
        │   └── use-auth.ts      # Authentication hook
        │
        ├── components/
        │   ├── layout/
        │   │   ├── navbar.tsx
        │   │   └── footer.tsx
        │   │
        │   ├── ui/              # Reusable UI components
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── select.tsx
        │   │   ├── tabs.tsx
        │   │   ├── textarea.tsx
        │   │   ├── badge.tsx
        │   │   └── FormElements.tsx
        │   │
        │   ├── search/
        │   │   └── SearchBar.tsx
        │   │
        │   ├── listings/
        │   │   └── property-card.tsx
        │   │
        │   ├── admin/
        │   │   ├── AdminSidebar.tsx
        │   │   ├── LocationPicker.tsx
        │   │   ├── PropertyForm.tsx
        │   │   ├── PropertyVerificationModal.tsx
        │   │   └── UserVerificationModal.tsx
        │   │
        │   ├── location-picker.tsx
        │   └── map-viewer.tsx
        │
        └── app/                 # Next.js App Router pages
            ├── favicon.ico
            ├── globals.css      # Global styles
            ├── layout.tsx       # Root layout
            ├── page.tsx         # Home page
            │
            ├── (auth)/
            │   └── login/
            │       └── page.tsx
            │
            ├── complete-profile/
            │   └── page.tsx
            │
            ├── search/
            │   └── page.tsx     # Property search
            │
            ├── property/
            │   └── [id]/
            │       └── page.tsx # Property detail
            │
            └── dashboard/
                ├── layout.tsx
                ├── page.tsx
                │
                ├── overview/
                │   └── page.tsx
                │
                ├── kyc/
                │   ├── page.tsx
                │   └── callback/
                │       └── page.tsx
                │
                ├── my-listings/
                │   ├── page.tsx
                │   └── create/
                │       └── page.tsx
                │
                └── admin/
                    ├── layout.tsx
                    ├── page.tsx
                    │
                    ├── properties/
                    │   ├── page.tsx
                    │   ├── create/
                    │   │   └── page.tsx
                    │   └── [id]/
                    │       └── edit/
                    │           └── page.tsx
                    │
                    └── users/
                        └── page.tsx


# =============================================================================
# SECURITY-CRITICAL FILES (⚡ marked above)
# =============================================================================
# 
# 1. saudapakka_backend/src/saudapakka/settings.py
#    - SECRET_KEY from os.getenv()
#    - DEBUG = False
#    - CORS_ALLOWED_ORIGINS = ['https://saudapakka.com']
#    - JWT: 15min access, 24hr refresh
#    - Security headers (HSTS, XSS, SSL)
#    - WhiteNoise for static files
#    - Rate limiting
#
# 2. saudapakka_frontend/next.config.ts
#    - output: 'standalone' for Docker
#    - NEXT_PUBLIC_API_URL env var
#
# 3. saudapakka_frontend/src/lib/axios.ts
#    - baseURL from NEXT_PUBLIC_API_URL
#
# =============================================================================
