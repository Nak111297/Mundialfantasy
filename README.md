# ⚽ Mundial Fantasy 2026

Fantasy por **draft de selecciones** para el Mundial 2026 (Canadá · México · EE.UU.).
Grupos de 4, 6 u 8 amigos se reparten las 48 selecciones en un draft tipo
serpiente y suman puntos con cada gol, victoria y fase superada.

- **Web app** con Next.js + Tailwind, lista para desplegar en **Vercel**.
- **Memoria y tiempo real** con **Firebase** (Firestore + sesión anónima):
  todos ven el draft y la clasificación en vivo.
- **Ligas privadas**: cada grupo juega aislado con su código de invitación de
  6 caracteres; los resultados del torneo son globales y alimentan a todas
  las ligas a la vez.

## Sistema de puntos (por defecto)

| Concepto | Puntos |
| --- | --- |
| Gol a favor (todas las fases) | **+1** |
| Gol en contra (todas las fases) | **−1** |
| Portería a cero | **+2** |
| Victoria en fase de grupos | **+3** |
| Empate en fase de grupos | **+1** |
| Clasificar a 32avos | **+5** |
| Ganar en 32avos | **+4** |
| Ganar en octavos | **+6** |
| Ganar en cuartos | **+8** |
| Ganar la semifinal (llegar a la final) | **+10** |
| Campeón del mundo | **+15** |
| Ganar el 3er lugar | **+4** |

Diseño: en eliminatorias no hay puntos de victoria — el valor está en los
bonos de avance, que escalan ronda a ronda. Ganar en penales otorga el bono
de avance pero los penales no cuentan como goles. Los goles en contra restan
para que las cenicientas no sean puntos gratis y los picks defensivos valgan.

## Puesta en marcha

### 1. Firebase (gratis, plan Spark)

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method → Anonymous → Habilitar.**
3. **Firestore Database → Crear base de datos** (modo producción).
4. En **Reglas**, pega el contenido de [`firestore.rules`](./firestore.rules) y publica.
5. **Configuración del proyecto → Tus apps → Web (\</\>)**: registra la app y
   copia las credenciales.

### 2. Local

```bash
cp .env.example .env.local   # pega ahí las credenciales de Firebase
npm install
npm run dev                  # http://localhost:3000
```

### 3. Desplegar en Vercel

1. Importa este repo en [vercel.com/new](https://vercel.com/new).
2. En **Environment Variables**, agrega las mismas 6 variables `NEXT_PUBLIC_FIREBASE_*`.
3. Deploy. Comparte la URL con tus ligas. 🎉

## Cómo se juega

1. Un jugador crea la liga (elige 4, 6 u 8 participantes) y comparte el **código**.
2. Cuando estén todos, el comisionado inicia el **draft**: orden aleatorio en
   serpiente (1→N, luego N→1, …) hasta repartir las 48 selecciones
   (12, 8 o 6 equipos por jugador).
3. Durante el torneo, los resultados se capturan una sola vez en
   **/resultados** y la clasificación de todas las ligas se actualiza al
   instante.

> Por defecto cualquier usuario puede capturar resultados (modo honor). Para
> limitarlo a administradores, ajusta la regla de `results` en
> `firestore.rules` con los UIDs que quieras autorizar.

## Estructura

- `lib/data.ts` — las 48 selecciones y los 12 grupos del sorteo oficial, y el
  calendario round-robin de la fase de grupos.
- `lib/scoring.ts` — motor de puntos (puro, testeable): los bonos de avance se
  infieren de la presencia de cada equipo en rondas posteriores.
- `lib/league.ts` — crear/unirse a ligas, draft con transacciones de Firestore
  (sin picks duplicados aunque dos personas elijan a la vez) y hooks en
  tiempo real.
- `app/` — páginas: inicio, liga (lobby/clasificación), draft, reglas,
  equipos y captura de resultados.
