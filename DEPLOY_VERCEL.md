# Configuración para Deploy en Vercel

## Variables de Entorno

Cuando despliegues el frontend en Vercel, debes agregar la siguiente variable de entorno:

### Variable de Entorno Requerida

- **Nombre:** `VITE_API_URL`
- **Valor:** `https://saturno-backend-15ur.onrender.com/api`

## Pasos para Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega la variable:
   - Name: `VITE_API_URL`
   - Value: `https://saturno-backend-15ur.onrender.com/api`
4. Guarda los cambios
5. Realiza un nuevo deploy o espera a que se complete el deploy actual

## Configuración Build

Vercel debería detectar automáticamente que es un proyecto Vite. Si necesitas configurarlo manualmente:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Notas Importantes

⚠️ **IMPORTANTE:** La variable `VITE_API_URL` debe incluir `/api` al final porque el backend tiene todas sus rutas bajo `/api`.

✅ **Verificación:** Después del deploy, abre la consola del navegador en tu sitio de Vercel y verifica que las peticiones vayan a `https://saturno-backend-15ur.onrender.com/api` y no a `localhost`.

## Desarrollo Local

Para desarrollo local, el archivo `.env` ya está configurado con:
```
VITE_API_URL=http://localhost:3000/api
```

Este archivo NO se sube a git (está en `.gitignore`), así que cada desarrollador debe crearlo localmente o copiar `.env.example`.
