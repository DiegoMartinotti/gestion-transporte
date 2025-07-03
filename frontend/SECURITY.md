# 🔒 Security Guidelines

## 🚨 Incidente de Seguridad Resuelto

**Fecha**: 2025-07-03  
**Issue**: GitGuardian detectó JWT tokens reales en archivos de test  
**Resolución**: Tokens reemplazados por mocks seguros  
**Commit**: `d69756c` - "fix: Remove real JWT tokens from tests"

## 🛡️ Directrices de Seguridad

### ❌ Nunca Commitear

- **JWT tokens reales** - Usar mocks: `'mock.valid.token'`
- **API keys** - Usar variables de entorno
- **Passwords** - Ni siquiera de prueba
- **Private keys** - Archivos .key, .pem, etc.
- **Database credentials** - Solo en .env (git ignored)

### ✅ Buenas Prácticas

#### 1. Variables de Entorno
```bash
# .env (git ignored)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_MAPS_KEY=your_key_here
```

#### 2. Mocks para Tests
```javascript
// ❌ MAL
const realToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ✅ BIEN
const mockToken = 'mock.valid.token'
```

#### 3. Configuración Segura
```typescript
// constants/index.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';
```

## 🔍 GitGuardian Integration

Este proyecto está monitoreado por **GitGuardian** que detecta automáticamente:
- JWT tokens
- API keys  
- High entropy secrets
- Database credentials
- Private keys

### Alertas Automáticas
Cuando se detecta un secreto:
1. **Inmediatamente** remover del código
2. **Revocar** el secreto si es real
3. **Regenerar** nuevas credenciales
4. **Commit** la corrección

## 🧪 Testing Seguro

### JWT Tokens en Tests
```javascript
// tests/services/authService.test.tsx
const validToken = 'mock.valid.token';     // ✅ Seguro
const expiredToken = 'mock.expired.token'; // ✅ Seguro  
const userToken = 'mock.user.token';       // ✅ Seguro
```

### API Mocking
```javascript
// Mock servicios externos
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn()
}));
```

## 🚀 CI/CD Security

### Pre-commit Hooks
```bash
# Instalar git-secrets
npm install --save-dev git-secrets

# Configurar hooks
git secrets --register-aws
git secrets --install
```

### Environment Variables
```yaml
# .github/workflows/test.yml
env:
  REACT_APP_API_URL: http://localhost:3001
  REACT_APP_GOOGLE_MAPS_KEY: ${{ secrets.GOOGLE_MAPS_KEY }}
```

## 📋 Security Checklist

### Antes de Commit
- [ ] No hay tokens reales en el código
- [ ] Variables sensibles en .env
- [ ] Tests usan mocks seguros
- [ ] .gitignore incluye archivos sensibles
- [ ] No hay credenciales hardcodeadas

### Antes de Deploy
- [ ] Variables de entorno configuradas
- [ ] Secrets rotados si fueron expuestos
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Error handling no expone datos sensibles

## 🆘 Incident Response

### Si GitGuardian Alerta:
1. **STOP** - No hacer más commits
2. **IDENTIFY** - Qué secreto fue expuesto
3. **REVOKE** - Invalidar inmediatamente
4. **REPLACE** - Con mock o variable de entorno
5. **COMMIT** - Corrección de seguridad
6. **REGENERATE** - Nuevas credenciales si necesario

### Contacts
- **Security Lead**: [Your contact]
- **GitGuardian**: Monitor automático
- **Emergency**: Rotar todas las keys

## 📚 Referencias

- [GitGuardian Best Practices](https://gitguardian.com)
- [OWASP Security Guidelines](https://owasp.org)
- [React Security Best Practices](https://react.dev/learn/security)

---

**Última actualización**: 2025-07-03  
**Próxima revisión**: 2025-08-03