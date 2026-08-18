FROM node:18

WORKDIR /app

# Pehle sirf package.json copy karo, taaki cache sahi rahe
COPY backend/package*.json ./backend/

# Backend dependencies install karo
RUN cd backend && npm install --omit=dev

# Ab pura backend code copy karo
COPY backend ./backend

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]