FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:17-jdk-alpine AS backend
WORKDIR /app
COPY backend/.mvn backend/.mvn
COPY backend/mvnw backend/pom.xml ./backend/
RUN cd backend && ./mvnw dependency:go-offline
COPY backend/src backend/src
COPY --from=frontend /app/frontend/dist frontend/dist
RUN cd backend && ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S pharmasathi && adduser -S pharmasathi -G pharmasathi
WORKDIR /app
COPY --from=backend /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER pharmasathi
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8765/api/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
