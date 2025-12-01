# ============================
# Stage 1: Build dependencies
# ============================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Cài dep production
RUN npm ci --only=production

# Copy source code
COPY . .

# ============================
# Stage 2: Runtime
# ============================
FROM node:20-alpine

# Tạo user không phải root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

# Chỉ copy node_modules + source cần thiết
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/*.js ./
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/model ./model

EXPOSE 3003

USER appuser

CMD ["npm", "start"]
