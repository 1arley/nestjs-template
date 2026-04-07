# Authentication Guide

## Architecture

This project uses a dual-token strategy with automatic rotation:

```
┌─────────────┐      ┌─────────────────────────┐
│   Client    │      │   Server                │
│             │      │                         │
│ POST /login  ────► │  Verify credentials      │
│             │      │  Generate access token   │
│             │      │  Generate refresh token   │
│             │      │  Hash refresh → DB       │
│             │      │                          │
│ Bearer JWT  ◄───── │  Return access in body   │
│ Cookie RT   ◄───── │  Set refresh as httpOnly │
│             │      │                          │
│ POST /refresh────► │  Verify refresh token    │
│ (auto cookie)│     │  Compare hash in DB      │
│ New Bearer  ◄───── │  Issue new access token  │
│ New Cookie  ◄───── │  Issue new refresh token │
└─────────────┘      └─────────────────────────┘
```

## Token Types

| Token    | TTL  | Where it's stored              | Purpose                   |
|----------|------|--------------------------------|---------------------------|
| Access   | 15m  | `Authorization` header (Bearer)| Authenticate API calls    |
| Refresh  | 7d   | `httpOnly` cookie (automatic)  | Issue new access tokens   |

## Refresh Token Rotation

Every call to `POST /auth/refresh` rotates the token pair:
1. Reads the refresh token automatically from the httpOnly cookie
2. Verifies the JWT signature
3. Compares against the stored hash in the database
4. Issues a new pair of tokens — the old refresh token is invalidated immediately

This means:
- Refresh tokens are single-use
- If stolen, a stolen token becomes useless right after the real client refreshes
- The `httpOnly` flag prevents JavaScript access (XSS mitigation)

## Privilege Escalation Prevention

New registrations always receive the `USER` role, even if a malicious client sends `ADMIN` or `SUPERADMIN` in the request body. See `src/auth/auth.service.ts` → `register()`.

## Protecting Routes

```typescript
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { Role } from '../common/enums/role.enum'

// Require authentication
@Get('secret')
@UseGuards(JwtAuthGuard)
getSecret() { ... }

// Require specific role
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
getAdminData() { ... }
```

## Using @CurrentUser()

```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Get('me')
getProfile(@CurrentUser() user: any) {
    return user // { id, name, email, role, createdAt, updatedAt }
}
```

## Environment Configuration

```env
JWT_ACCESS_SECRET=your-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Checklist

- Never commit `.env` files
- Use strong token secrets (32+ chars)
- Configure appropriate CORS origins
- Enable HTTPS in production
- The `secure` flag on cookies is already set to `true` only in production
